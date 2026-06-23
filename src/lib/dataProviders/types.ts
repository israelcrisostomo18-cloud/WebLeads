import type { BusinessLead, DataProviderSource, NormalizedPlace } from "@/types";

export type SearchProviderArgs = {
  state: string;
  city: string;
  niche: string;
  radiusKm: number;
  latitude: number;
  longitude: number;
};

export type DataProvider = {
  id: DataProviderSource;
  label: string;
  search: (args: SearchProviderArgs) => Promise<NormalizedPlace[]>;
};

export function normalizedPlaceToLead(place: NormalizedPlace, args: SearchProviderArgs): BusinessLead {
  const providerType = place.source === "osm" ? "node" : place.source === "foursquare" ? "way" : "relation";
  const providerUrl =
    place.source === "osm"
      ? `https://www.openstreetmap.org/${providerType}/${place.id}`
      : place.source === "foursquare"
        ? `https://foursquare.com/v/${place.id}`
        : `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=17/${place.latitude}/${place.longitude}`;

  return {
    source: place.source,
    osmId: place.source === "osm" ? place.id : `${place.source}:${place.id}`,
    osmType: providerType,
    name: place.name,
    address: place.address,
    phone: place.phone,
    email: null,
    website: place.website,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    osmUrl: providerUrl,
    city: args.city,
    state: args.state,
    niche: args.niche,
    hasWebsite: place.has_website,
    rawTags: Object.fromEntries(
      Object.entries(place.raw_data).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value ?? null),
      ]),
    ),
  };
}
