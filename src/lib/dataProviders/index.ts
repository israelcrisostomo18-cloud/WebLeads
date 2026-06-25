import { foursquareProvider } from "@/lib/dataProviders/foursquareProvider";
import { googleProvider } from "@/lib/dataProviders/googleProvider";
import { osmProvider } from "@/lib/dataProviders/osmProvider";
import type { DataProvider } from "@/lib/dataProviders/types";
import type { DataProviderSource } from "@/types";

export const dataProviders: Record<DataProviderSource, DataProvider> = {
  osm: osmProvider,
  foursquare: foursquareProvider,
  google: googleProvider,
};

export function getDataProvider(source: DataProviderSource) {
  return dataProviders[source] ?? osmProvider;
}

export type { DataProvider, SearchProviderArgs } from "@/lib/dataProviders/types";
export { normalizedPlaceToLead } from "@/lib/dataProviders/types";
