import type { DataProvider, SearchProviderArgs } from "@/lib/dataProviders/types";
import type { NormalizedPlace } from "@/types";

const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.location",
  "places.types",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
].join(",");

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
};

type GooglePlacesResponse = {
  places?: GooglePlace[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

function getGoogleApiKey() {
  return process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim() || process.env.GOOGLE_PLACES_API_KEY?.trim() || "";
}

function googleErrorMessage(status: number, payload: GooglePlacesResponse | null) {
  const text = `${payload?.error?.status ?? ""} ${payload?.error?.message ?? ""}`.toLowerCase();

  if (status === 401 || text.includes("api key not valid")) {
    return "Google Places não aceitou a chave de API. Verifique GOOGLE_MAPS_SERVER_API_KEY na Vercel.";
  }

  if (status === 403 && (text.includes("billing") || text.includes("billingnotenabled"))) {
    return "Google Maps ainda não está configurado. Verifique a chave de API e o billing no Google Cloud.";
  }

  if (status === 403 && (text.includes("not been used") || text.includes("disabled") || text.includes("api has not"))) {
    return "API do Google Places não está habilitada para este projeto.";
  }

  if (status === 403 && (text.includes("referer") || text.includes("permission") || text.includes("not authorized"))) {
    return "Essa chave de API não está autorizada para este domínio ou para esta API.";
  }

  if (status === 429 || text.includes("quota")) {
    return "Cota do Google Places excedida. Tente novamente mais tarde ou revise os limites no Google Cloud.";
  }

  return payload?.error?.message || "Não foi possível buscar empresas no Google Places agora.";
}

function normalizeGooglePlace(place: GooglePlace): NormalizedPlace | null {
  const latitude = Number(place.location?.latitude);
  const longitude = Number(place.location?.longitude);

  if (!place.id || !place.displayName?.text || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const website = place.websiteUri ?? null;

  return {
    id: place.id,
    source: "google",
    name: place.displayName.text,
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    website,
    category: place.types?.[0] ?? null,
    latitude,
    longitude,
    has_website: Boolean(website),
    raw_data: {
      google_maps_url: place.googleMapsUri ?? "",
      rating: place.rating ?? null,
      user_rating_count: place.userRatingCount ?? null,
      types: place.types ?? [],
    },
  };
}

export const googleProvider: DataProvider = {
  id: "google",
  label: "Google Places",
  async search(args: SearchProviderArgs) {
    const apiKey = getGoogleApiKey();

    if (!apiKey) {
      throw new Error("Google Maps ainda não está configurado. Adicione GOOGLE_MAPS_SERVER_API_KEY nas variáveis de ambiente.");
    }

    const radiusMeters = Math.min(Math.max(args.radiusKm, 1), 50) * 1000;
    const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${args.niche} em ${args.city} ${args.state}`,
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: {
              latitude: args.latitude,
              longitude: args.longitude,
            },
            radius: radiusMeters,
          },
        },
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as GooglePlacesResponse | null;

    if (!response.ok) {
      throw new Error(googleErrorMessage(response.status, payload));
    }

    return (payload?.places ?? [])
      .map(normalizeGooglePlace)
      .filter((place): place is NormalizedPlace => Boolean(place));
  },
};
