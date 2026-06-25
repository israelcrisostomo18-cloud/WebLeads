export type ManualLead = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  estado: string;
  nicho: string;
  temSite: boolean | null;
  site: string;
  endereco: string;
  fonte: string;
};

// Edite esta lista para cadastrar seus leads fixos.
// O sistema trabalha esses leads em lotes de 10 na pagina /prospeccao-manual.
export const leadsFixos: ManualLead[] = [
  {
    id: "1",
    nome: "Barbearia Alfa",
    telefone: "92999999999",
    cidade: "Manaus",
    estado: "AM",
    nicho: "Barbearia",
    temSite: false,
    site: "",
    endereco: "Manaus - AM",
    fonte: "Lista fixa",
  },
  {
    id: "2",
    nome: "Clinica Bella",
    telefone: "92988888888",
    cidade: "Manaus",
    estado: "AM",
    nicho: "Estetica",
    temSite: true,
    site: "https://exemplo.com",
    endereco: "Manaus - AM",
    fonte: "Lista fixa",
  },
];
