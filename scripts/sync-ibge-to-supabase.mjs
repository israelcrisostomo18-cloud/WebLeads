import { createClient } from "@supabase/supabase-js";
import states from "../src/data/brazil-cities.json" with { type: "json" };

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de sincronizar.");
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const stateRows = states.map((state) => ({
  ibge_id: state.id,
  uf: state.uf,
  name: state.name,
}));

const { error: statesError } = await supabase.from("states").upsert(stateRows, {
  onConflict: "uf",
});

if (statesError) {
  throw statesError;
}

for (const state of states) {
  const cityRows = state.cities.map((city) => ({
    ibge_code: city.ibgeCode,
    state_uf: state.uf,
    name: city.name,
  }));

  const { error } = await supabase.from("cities").upsert(cityRows, {
    onConflict: "ibge_code",
  });

  if (error) {
    throw error;
  }
}

console.log(
  `Synced ${states.reduce((total, state) => total + state.cities.length, 0)} cities and ${states.length} states.`,
);
