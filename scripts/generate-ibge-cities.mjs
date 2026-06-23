import { writeFile } from "node:fs/promises";

const STATES_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome";

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`IBGE request failed: ${response.status} ${url}`);
  }

  return response.json();
}

const states = await getJson(STATES_URL);

const records = await Promise.all(
  states.map(async (state) => {
    const cities = await getJson(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state.sigla}/municipios?orderBy=nome`,
    );

    return {
      id: state.id,
      uf: state.sigla,
      name: state.nome,
      cities: cities.map((city) => ({
        id: city.id,
        name: city.nome,
        ibgeCode: String(city.id),
      })),
    };
  }),
);

await writeFile(
  new URL("../src/data/brazil-cities.json", import.meta.url),
  `${JSON.stringify(records, null, 2)}\n`,
  "utf8",
);

console.log(
  `Generated ${records.reduce((total, state) => total + state.cities.length, 0)} cities in ${records.length} states.`,
);
