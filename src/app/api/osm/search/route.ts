import { NextResponse } from "next/server";
import { getCityCoordinates } from "@/lib/city-geocoding";
import { getDataProvider, normalizedPlaceToLead } from "@/lib/dataProviders";
import { leadToDatabaseRow, rowToLead } from "@/lib/openstreetmap";
import { getDemoUserId, getSupabaseAdmin } from "@/lib/supabase";
import {
  canCreateLandingPage,
  canViewLeadDetails,
  getCurrentAccessUser,
  type CurrentAccessUser,
} from "@/lib/auth/permissions";
import type { BusinessLead, DataProviderSource, SearchResponse } from "@/types";

const CACHE_HOURS = 24;
const DEFAULT_DAILY_LIMIT = 30;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DATA_PROVIDER_IDS: DataProviderSource[] = ["osm", "foursquare", "google"];

type SearchBody = {
  provider?: DataProviderSource;
  searchType?: "city" | "map";
  state?: string;
  city?: string;
  niche?: string;
  radiusKm?: number;
  centerLat?: number;
  centerLng?: number;
  refresh?: boolean;
};

type LeadSearchMode = "auto" | "public" | "private";

function sanitizeLeadForPublic(lead: BusinessLead): BusinessLead {
  return {
    ...lead,
    address: "",
    phone: null,
    email: null,
    website: null,
    hasWebsite: false,
    osmUrl: "",
    rawTags: {},
  };
}

function buildAccessResponse(user: CurrentAccessUser, forceLimited = false): NonNullable<SearchResponse["access"]> {
  const full = !forceLimited && canViewLeadDetails(user);

  return {
    mode: full ? "full" : "limited",
    status: user.status,
    canViewLeadDetails: full,
    canCreateLandingPage: !forceLimited && canCreateLandingPage(user),
  };
}

function applyAccessToResponse(response: SearchResponse, user: CurrentAccessUser, forceLimited = false): SearchResponse {
  const access = buildAccessResponse(user, forceLimited);
  const businesses = access.mode === "full" ? response.businesses : response.businesses.map(sanitizeLeadForPublic);

  return {
    ...response,
    access,
    totalWithoutWebsite:
      access.mode === "full"
        ? response.totalWithoutWebsite
        : businesses.filter((business) => !business.hasWebsite).length,
    businesses,
  };
}

function normalizeRadiusKm(value: unknown) {
  const radius = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);

  if (!Number.isFinite(radius)) {
    return 5;
  }

  return Math.min(Math.max(Math.round(radius), MIN_RADIUS_KM), MAX_RADIUS_KM);
}

function distanceInKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const latDelta = ((b.latitude - a.latitude) * Math.PI) / 180;
  const lngDelta = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

async function getCachedLeads(args: {
  provider: DataProviderSource;
  searchType: "city" | "map";
  state?: string;
  city?: string;
  niche: string;
  radiusKm: number;
  centerLat?: number;
  centerLng?: number;
}): Promise<BusinessLead[] | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const since = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();

  let searchQuery = supabase
    .from("searches")
    .select("id")
    .eq("provider", args.provider)
    .eq("search_type", args.searchType)
    .eq("niche", args.niche)
    .eq("radius_km", args.radiusKm)
    .gte("searched_at", since);

  if (args.searchType === "city") {
    searchQuery = searchQuery.eq("state", args.state).eq("city", args.city);
  } else {
    searchQuery = searchQuery
      .gte("center_lat", Number(args.centerLat) - 0.01)
      .lte("center_lat", Number(args.centerLat) + 0.01)
      .gte("center_lng", Number(args.centerLng) - 0.01)
      .lte("center_lng", Number(args.centerLng) + 0.01);
  }

  const { data: search } = await searchQuery
    .order("searched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!search) {
    return null;
  }

  let businessQuery = supabase
    .from("businesses")
    .select("*")
    .eq("source", args.provider)
    .eq("niche", args.niche)
    .order("has_website", { ascending: true })
    .order("name", { ascending: true });

  if (args.searchType === "city") {
    businessQuery = businessQuery.eq("state", args.state).eq("city", args.city);
  } else {
    const lat = Number(args.centerLat);
    const lng = Number(args.centerLng);
    const delta = Math.max(args.radiusKm / 111, 0.01);
    businessQuery = businessQuery
      .gte("latitude", lat - delta)
      .lte("latitude", lat + delta)
      .gte("longitude", lng - delta)
      .lte("longitude", lng + delta);
  }

  const { data: rows, error } = await businessQuery;

  if (error || !rows?.length) {
    return null;
  }

  const leads = rows.map((row) => rowToLead(row));
  const centerLat = Number(args.centerLat);
  const centerLng = Number(args.centerLng);

  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    return leads;
  }

  const leadsWithinRadius = leads.filter(
    (lead) =>
      distanceInKm(
        { latitude: centerLat, longitude: centerLng },
        { latitude: lead.latitude, longitude: lead.longitude },
      ) <= args.radiusKm,
  );

  return leadsWithinRadius.length ? leadsWithinRadius : null;
}

async function getUsageLimit() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { remaining: null, canSearch: true };
  }

  const today = new Date().toISOString().slice(0, 10);
  const userId = getDemoUserId();
  const limit = Number(process.env.DAILY_SEARCH_LIMIT ?? DEFAULT_DAILY_LIMIT);

  let { data } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  if (!data) {
    const { data: inserted } = await supabase
      .from("usage_limits")
      .insert({
        user_id: userId,
        usage_date: today,
        daily_limit: limit,
        searches_used: 0,
      })
      .select("*")
      .single();
    data = inserted;
  }

  const used = Number(data?.searches_used ?? 0);
  const dailyLimit = Number(data?.daily_limit ?? limit);

  return {
    remaining: Math.max(0, dailyLimit - used),
    canSearch: used < dailyLimit,
  };
}

async function consumeUsage() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const userId = getDemoUserId();

  const { data } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .single();

  const nextUsed = Number(data?.searches_used ?? 0) + 1;

  const { data: updated } = await supabase
    .from("usage_limits")
    .update({ searches_used: nextUsed, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("usage_date", today)
    .select("*")
    .single();

  return Math.max(0, Number(updated?.daily_limit ?? 0) - Number(updated?.searches_used ?? 0));
}

async function saveSearch(args: {
  provider: DataProviderSource;
  searchType: "city" | "map";
  state: string;
  city: string;
  niche: string;
  radiusKm: number;
  centerLat: number;
  centerLng: number;
  businesses: BusinessLead[];
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  if (args.businesses.length) {
    await supabase.from("businesses").upsert(args.businesses.map(leadToDatabaseRow), {
      onConflict: "osm_type,osm_id",
    });
  }

  await supabase.from("searches").insert({
    user_id: getDemoUserId(),
    provider: args.provider,
    search_type: args.searchType,
    state: args.state,
    city: args.city,
    niche: args.niche,
    radius_km: args.radiusKm,
    center_lat: args.centerLat,
    center_lng: args.centerLng,
    total_results: args.businesses.length,
    total_without_website: args.businesses.filter((business) => !business.hasWebsite).length,
  });
}

export async function handleLeadSearch(request: Request, mode: LeadSearchMode = "auto") {
  const accessUser = await getCurrentAccessUser();

  if (mode === "private" && !canViewLeadDetails(accessUser)) {
    return NextResponse.json(
      { error: "Assinatura ativa necessaria para acessar dados completos." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as SearchBody;
  const provider = DATA_PROVIDER_IDS.includes(body.provider as DataProviderSource)
    ? (body.provider as DataProviderSource)
    : "osm";
  const searchType = body.searchType ?? "city";
  const state = body.state?.trim();
  const city = body.city?.trim();
  const niche = body.niche?.trim();
  const radiusKm = normalizeRadiusKm(body.radiusKm ?? 5);

  if (!niche) {
    return NextResponse.json(
      { error: "Escolha um nicho antes de buscar." },
      { status: 400 },
    );
  }

  if (searchType === "city" && (!state || !city)) {
    return NextResponse.json(
      { error: "Informe estado, cidade e nicho." },
      { status: 400 },
    );
  }

  if (searchType === "map" && (!Number.isFinite(body.centerLat) || !Number.isFinite(body.centerLng))) {
    return NextResponse.json(
      { error: "Clique no mapa para selecionar a área de busca." },
      { status: 400 },
    );
  }

  if (!body.refresh) {
    const cached = await getCachedLeads({
      provider,
      searchType,
      state,
      city,
      niche,
      radiusKm,
      centerLat: body.centerLat,
      centerLng: body.centerLng,
    });

    if (cached) {
      const response: SearchResponse = {
        source: "cache",
        provider,
        creditsRemaining: (await getUsageLimit()).remaining,
        totalResults: cached.length,
        totalWithoutWebsite: cached.filter((business) => !business.hasWebsite).length,
        businesses: cached,
      };

      return NextResponse.json(applyAccessToResponse(response, accessUser, mode === "public"));
    }
  }

  const usage = await getUsageLimit();

  if (!usage.canSearch) {
    return NextResponse.json(
      { error: "Limite diário de buscas atingido." },
      { status: 429 },
    );
  }

  const coordinates =
    searchType === "city"
      ? Number.isFinite(body.centerLat) && Number.isFinite(body.centerLng)
        ? {
            latitude: Number(body.centerLat),
            longitude: Number(body.centerLng),
          }
        : await getCityCoordinates({ state: state as string, city: city as string })
      : {
          latitude: Number(body.centerLat),
          longitude: Number(body.centerLng),
        };
  const resolvedState = searchType === "city" ? (state as string) : "MAP";
  const resolvedCity =
    searchType === "city"
      ? (city as string)
      : `Área ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;

  const searchArgs = {
    state: resolvedState,
    city: resolvedCity,
    niche,
    radiusKm,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
  const selectedProvider = getDataProvider(provider);
  let places;

  try {
    places = await selectedProvider.search(searchArgs);
  } catch (providerError) {
    return NextResponse.json(
      {
        error:
          providerError instanceof Error
            ? providerError.message
            : "Não foi possível buscar dados nessa fonte.",
      },
      { status: 502 },
    );
  }

  const businesses = places.map((place) => normalizedPlaceToLead(place, searchArgs));

  await saveSearch({
    provider,
    searchType,
    state: resolvedState,
    city: resolvedCity,
    niche,
    radiusKm,
    centerLat: coordinates.latitude,
    centerLng: coordinates.longitude,
    businesses,
  });
  const remaining = await consumeUsage();

  const response: SearchResponse = {
    source: provider === "osm" ? "overpass" : provider,
    provider,
    creditsRemaining: remaining,
    totalResults: businesses.length,
    totalWithoutWebsite: businesses.filter((business) => !business.hasWebsite).length,
    businesses,
  };

  return NextResponse.json(applyAccessToResponse(response, accessUser, mode === "public"));
}

export async function POST(request: Request) {
  return handleLeadSearch(request, "auto");
}
