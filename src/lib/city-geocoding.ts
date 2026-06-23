import { geocodeCity } from "@/lib/openstreetmap";
import { getSupabaseAdmin } from "@/lib/supabase";

export type CityCoordinates = {
  latitude: number;
  longitude: number;
};

export async function getCityCoordinates(args: {
  state: string;
  city: string;
  ibgeCode?: string | null;
}): Promise<CityCoordinates> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data } = await supabase
      .from("city_coordinates")
      .select("*")
      .eq("state", args.state)
      .eq("city", args.city)
      .maybeSingle();

    if (data) {
      return {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      };
    }
  }

  const coordinates = await geocodeCity(args);

  if (supabase) {
    await supabase.from("city_coordinates").upsert(
      {
        state: args.state,
        city: args.city,
        ibge_code: args.ibgeCode ?? null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        source: "nominatim",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "state,city" },
    );
  }

  return coordinates;
}
