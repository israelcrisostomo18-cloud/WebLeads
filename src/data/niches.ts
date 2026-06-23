export type OsmFilter = {
  key: string;
  value: string;
};

export type NicheDefinition = {
  label: string;
  filters: OsmFilter[];
};

export const NICHES = [
  "barbearia",
  "salão de beleza",
  "clínica odontológica",
  "oficina mecânica",
  "restaurante",
  "pizzaria",
  "academia",
  "estética",
  "pet shop",
  "loja de roupas",
  "lava jato",
  "imobiliária",
  "escola",
  "mercadinho",
  "farmácia",
  "supermercado",
  "padaria",
  "dentista",
  "veterinário",
  "contabilidade",
] as const;

export const OSM_NICHE_FILTERS: Record<string, NicheDefinition> = {
  barbearia: { label: "barbearia", filters: [{ key: "shop", value: "hairdresser" }] },
  "salão de beleza": {
    label: "salão de beleza",
    filters: [
      { key: "shop", value: "beauty" },
      { key: "shop", value: "hairdresser" },
    ],
  },
  "clínica odontológica": { label: "clínica odontológica", filters: [{ key: "amenity", value: "dentist" }] },
  "oficina mecânica": { label: "oficina mecânica", filters: [{ key: "shop", value: "car_repair" }] },
  restaurante: { label: "restaurante", filters: [{ key: "amenity", value: "restaurant" }] },
  pizzaria: {
    label: "pizzaria",
    filters: [
      { key: "amenity", value: "restaurant" },
      { key: "amenity", value: "fast_food" },
      { key: "cuisine", value: "pizza" },
    ],
  },
  academia: { label: "academia", filters: [{ key: "leisure", value: "fitness_centre" }] },
  estética: {
    label: "estética",
    filters: [
      { key: "shop", value: "beauty" },
      { key: "amenity", value: "beauty" },
    ],
  },
  "pet shop": { label: "pet shop", filters: [{ key: "shop", value: "pet" }] },
  "loja de roupas": { label: "loja de roupas", filters: [{ key: "shop", value: "clothes" }] },
  "lava jato": { label: "lava jato", filters: [{ key: "amenity", value: "car_wash" }] },
  imobiliária: { label: "imobiliária", filters: [{ key: "office", value: "estate_agent" }] },
  escola: { label: "escola", filters: [{ key: "amenity", value: "school" }] },
  mercadinho: {
    label: "mercadinho",
    filters: [
      { key: "shop", value: "convenience" },
      { key: "shop", value: "general" },
    ],
  },
  farmácia: { label: "farmácia", filters: [{ key: "amenity", value: "pharmacy" }] },
  supermercado: { label: "supermercado", filters: [{ key: "shop", value: "supermarket" }] },
  padaria: { label: "padaria", filters: [{ key: "shop", value: "bakery" }] },
  dentista: { label: "dentista", filters: [{ key: "amenity", value: "dentist" }] },
  veterinário: { label: "veterinário", filters: [{ key: "amenity", value: "veterinary" }] },
  contabilidade: { label: "contabilidade", filters: [{ key: "office", value: "accountant" }] },
};
