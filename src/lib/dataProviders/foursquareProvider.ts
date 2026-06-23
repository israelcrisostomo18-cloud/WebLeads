import type { DataProvider, SearchProviderArgs } from "@/lib/dataProviders/types";
import type { NormalizedPlace } from "@/types";

const FOURSQUARE_SEARCH_URL =
  process.env.FOURSQUARE_API_URL ?? "https://places-api.foursquare.com/places/search";
const FOURSQUARE_VERSION = "2025-06-17";
const MAX_RADIUS_KM = 50;

type FoursquarePlace = {
  fsq_place_id?: string;
  fsq_id?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  tel?: string;
  website?: string;
  link?: string;
  categories?: Array<{ name?: string }>;
  location?: {
    formatted_address?: string;
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
};

type FoursquareResponse = {
  results?: FoursquarePlace[];
};

function formatFoursquareAddress(location: FoursquarePlace["location"]) {
  if (!location) {
    return "";
  }

  return (
    location.formatted_address ??
    [location.address, location.locality, location.region, location.postcode, location.country]
      .filter(Boolean)
      .join(", ")
  );
}

export const foursquareProvider: DataProvider = {
  id: "foursquare",
  label: "Foursquare",
  async search(args: SearchProviderArgs): Promise<NormalizedPlace[]> {
    const apiKey = process.env.FOURSQUARE_API_KEY;

    if (!apiKey) {
      throw new Error("Configure FOURSQUARE_API_KEY para usar a fonte Foursquare.");
    }

    const url = new URL(FOURSQUARE_SEARCH_URL);
    url.searchParams.set("ll", `${args.latitude},${args.longitude}`);
    url.searchParams.set("radius", String(Math.min(Math.max(args.radiusKm, 1), MAX_RADIUS_KM) * 1000));
    url.searchParams.set("query", args.niche);
    url.searchParams.set("limit", "50");
    url.searchParams.set("sort", "DISTANCE");
    url.searchParams.set(
      "fields",
      "fsq_place_id,fsq_id,name,location,tel,website,link,categories,latitude,longitude",
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-Places-Api-Version": FOURSQUARE_VERSION,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Foursquare respondeu ${response.status}. Verifique a chave ou tente novamente mais tarde.`);
    }

    const payload = (await response.json()) as FoursquareResponse;
    const seen = new Set<string>();

    return (payload.results ?? [])
      .map((place) => {
        const id = place.fsq_place_id ?? place.fsq_id;
        const latitude = Number(place.latitude);
        const longitude = Number(place.longitude);

        if (!id || !place.name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        const normalized: NormalizedPlace = {
          id,
          source: "foursquare",
          name: place.name,
          address: formatFoursquareAddress(place.location),
          phone: place.tel ?? null,
          website: place.website ?? place.link ?? null,
          category: place.categories?.[0]?.name ?? args.niche,
          latitude,
          longitude,
          has_website: Boolean(place.website ?? place.link),
          raw_data: place as unknown as Record<string, unknown>,
        };

        return normalized;
      })
      .filter((place): place is NormalizedPlace => {
        if (!place || seen.has(place.id)) {
          return false;
        }

        seen.add(place.id);
        return true;
      });
  },
};
