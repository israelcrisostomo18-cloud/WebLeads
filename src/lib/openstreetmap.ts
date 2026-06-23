import { OSM_NICHE_FILTERS } from "@/data/niches";
import { formatAddress } from "@/lib/format";
import type { BusinessLead } from "@/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL =
  process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";
const OVERPASS_FALLBACK_URLS = [
  OVERPASS_URL,
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const OVERPASS_TIMEOUT_MS = 15000;

type Coordinates = {
  latitude: number;
  longitude: number;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export async function geocodeCity(args: {
  state: string;
  city: string;
}): Promise<Coordinates> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("city", args.city);
  url.searchParams.set("state", args.state);
  url.searchParams.set("country", "Brasil");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "MapaDeLeadsSemSiteOpenSource/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Nominatim respondeu ${response.status}.`);
  }

  const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = payload[0];

  if (!first) {
    throw new Error("Não foi possível encontrar coordenadas para essa cidade.");
  }

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
  };
}

function buildOverpassQuery(args: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  niche: string;
}) {
  const definition = OSM_NICHE_FILTERS[args.niche];

  if (!definition) {
    throw new Error("Nicho sem filtro OpenStreetMap configurado.");
  }

  const radiusMeters = Math.min(Math.max(args.radiusKm, MIN_RADIUS_KM), MAX_RADIUS_KM) * 1000;
  const selectors = definition.filters
    .flatMap((filter) => [
      `node["${filter.key}"="${filter.value}"](around:${radiusMeters},${args.latitude},${args.longitude});`,
      `way["${filter.key}"="${filter.value}"](around:${radiusMeters},${args.latitude},${args.longitude});`,
      `relation["${filter.key}"="${filter.value}"](around:${radiusMeters},${args.latitude},${args.longitude});`,
    ])
    .join("\n");

  return `
[out:json][timeout:35];
(
${selectors}
);
out center tags 200;
`;
}

function distanceInKm(a: Coordinates, b: Coordinates) {
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

function offsetCoordinates(center: Coordinates, northKm: number, eastKm: number): Coordinates {
  const latitude = center.latitude + northKm / 111.32;
  const longitude =
    center.longitude + eastKm / (111.32 * Math.cos((center.latitude * Math.PI) / 180));

  return { latitude, longitude };
}

function makeSearchAreas(args: {
  latitude: number;
  longitude: number;
  radiusKm: number;
}) {
  const radiusKm = Math.min(Math.max(args.radiusKm, MIN_RADIUS_KM), MAX_RADIUS_KM);
  const center = { latitude: args.latitude, longitude: args.longitude };

  if (radiusKm <= 25) {
    return [{ ...center, radiusKm }];
  }

  const stepKm = radiusKm / 2;
  const areas = [-stepKm, 0, stepKm].flatMap((northKm) =>
    [-stepKm, 0, stepKm].map((eastKm) => ({
      ...offsetCoordinates(center, northKm, eastKm),
      radiusKm: stepKm,
    })),
  );

  return areas.filter((area) => distanceInKm(center, area) <= radiusKm);
}

async function fetchOverpass(query: string) {
  const urls = Array.from(new Set(OVERPASS_FALLBACK_URLS));
  let lastError: Error | null = null;

  for (const url of urls) {
    const controller = new AbortController();
    const timeout = windowlessSetTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "MapaDeLeadsSemSiteOpenSource/1.0",
        },
        body: new URLSearchParams({ data: query }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Overpass respondeu ${response.status}.`);
      }

      return response;
    } catch (error) {
      lastError =
        error instanceof Error && error.name === "AbortError"
          ? new Error("Erro ao buscar dados. Tente novamente ou reduza o raio.")
          : error instanceof Error
            ? error
            : new Error("Falha ao consultar Overpass.");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Erro ao buscar dados. Tente novamente.");
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<R>,
) {
  const results: Array<PromiseSettledResult<R>> = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.allSettled(batch.map(task))));
  }

  return results;
}

export async function searchOverpass(args: {
  state: string;
  city: string;
  niche: string;
  radiusKm: number;
  latitude: number;
  longitude: number;
}): Promise<BusinessLead[]> {
  const center = { latitude: args.latitude, longitude: args.longitude };
  const areas = makeSearchAreas(args);
  const seen = new Set<string>();
  const chunks: BusinessLead[] = [];
  const results = await runInBatches(areas, 3, async (area) => {
      const response = await fetchOverpass(
        buildOverpassQuery({
          ...args,
          latitude: area.latitude,
          longitude: area.longitude,
          radiusKm: area.radiusKm,
        }),
      );

      return (await response.json()) as OverpassResponse;
  });

  const successfulChunks = results.filter((result) => result.status === "fulfilled").length;

  for (const result of results) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const element of result.value.elements ?? []) {
      const lead = elementToLead(element, args);

      if (!lead || seen.has(`${lead.osmType}-${lead.osmId}`)) {
        continue;
      }

      seen.add(`${lead.osmType}-${lead.osmId}`);
      chunks.push(lead);
    }
  }

  if (!successfulChunks && !chunks.length) {
    throw new Error("Erro ao buscar dados. Tente novamente ou reduza o raio.");
  }

  return chunks.filter(
    (lead) =>
      distanceInKm(center, { latitude: lead.latitude, longitude: lead.longitude }) <=
      Math.min(Math.max(args.radiusKm, MIN_RADIUS_KM), MAX_RADIUS_KM),
  );
}

function elementToLead(
  element: OverpassElement,
  args: {
    state: string;
    city: string;
    niche: string;
  },
): BusinessLead | null {
  const tags = element.tags ?? {};
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const name = tags.name ?? tags.brand ?? tags.operator;

  if (!latitude || !longitude || !name) {
    return null;
  }

  const website = tags.website ?? tags["contact:website"] ?? tags.url ?? null;
  const phone = tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? null;
  const email = tags.email ?? tags["contact:email"] ?? null;
  const category =
    tags.amenity ?? tags.shop ?? tags.office ?? tags.leisure ?? tags.craft ?? args.niche;
  const address = formatAddress(tags) || tags["addr:full"] || "";

  return {
    source: "osm",
    osmId: String(element.id),
    osmType: element.type,
    name,
    address,
    phone,
    email,
    website,
    category,
    latitude,
    longitude,
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    city: args.city,
    state: args.state,
    niche: args.niche,
    hasWebsite: Boolean(website),
    rawTags: tags,
  };
}

export function leadToDatabaseRow(lead: BusinessLead) {
  return {
    source: lead.source ?? "osm",
    osm_id: lead.osmId,
    osm_type: lead.osmType,
    name: lead.name,
    address: lead.address,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    category: lead.category,
    latitude: lead.latitude,
    longitude: lead.longitude,
    osm_url: lead.osmUrl,
    city: lead.city,
    state: lead.state,
    niche: lead.niche,
    has_website: lead.hasWebsite,
    raw_tags: lead.rawTags,
    updated_at: new Date().toISOString(),
  };
}

export function rowToLead(row: Record<string, unknown>): BusinessLead {
  return {
    id: row.id as string | undefined,
    source: (row.source as BusinessLead["source"] | undefined) ?? "osm",
    osmId: row.osm_id as string,
    osmType: row.osm_type as "node" | "way" | "relation",
    name: row.name as string,
    address: (row.address as string | null) ?? "",
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    osmUrl: row.osm_url as string,
    city: row.city as string,
    state: row.state as string,
    niche: row.niche as string,
    hasWebsite: Boolean(row.has_website),
    rawTags: (row.raw_tags as Record<string, string> | null) ?? {},
  };
}
