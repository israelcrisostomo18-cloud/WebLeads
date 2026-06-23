import { searchOverpass } from "@/lib/openstreetmap";
import type { DataProvider, SearchProviderArgs } from "@/lib/dataProviders/types";
import type { NormalizedPlace } from "@/types";

export const osmProvider: DataProvider = {
  id: "osm",
  label: "OpenStreetMap",
  async search(args: SearchProviderArgs): Promise<NormalizedPlace[]> {
    const leads = await searchOverpass(args);

    return leads.map((lead) => ({
      id: lead.osmId,
      source: "osm",
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      category: lead.category,
      latitude: lead.latitude,
      longitude: lead.longitude,
      has_website: lead.hasWebsite,
      raw_data: {
        osm_type: lead.osmType,
        osm_url: lead.osmUrl,
        ...lead.rawTags,
      },
    }));
  },
};
