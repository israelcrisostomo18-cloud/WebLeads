const nouns: Record<string, string> = {
  barbearia: "barbearia",
  padaria: "padaria",
  restaurante: "restaurante",
  "clínica odontológica": "clínica odontológica",
  "oficina mecânica": "oficina mecânica",
  estética: "clínica de estética",
  academia: "academia",
};

export function getNicheNoun(niche: string) {
  return nouns[niche.toLowerCase()] ?? "empresa local";
}

export function getGeneratedHeadline(args: { businessName: string; niche: string; city: string }) {
  const noun = getNicheNoun(args.niche);
  return `${args.businessName}: ${noun} em ${args.city || "sua região"} com presença online profissional`;
}

export function getGeneratedSubtitle(args: { niche: string; city: string }) {
  const noun = getNicheNoun(args.niche);
  return `Um site moderno para apresentar serviços, localização e contato direto pelo WhatsApp para quem procura ${noun} em ${args.city || "sua região"}.`;
}

export function getGeneratedAbout(args: { businessName: string; niche: string; city: string }) {
  const noun = getNicheNoun(args.niche);
  return `A ${args.businessName} atua como ${noun} em ${args.city || "sua região"} e pode usar este modelo para apresentar informações essenciais de forma clara: serviços, endereço, diferenciais e um caminho rápido para atendimento pelo WhatsApp.`;
}

export function getGeneratedDifferentials(niche: string) {
  if (niche.toLowerCase().includes("oficina")) {
    return ["Orçamento mais rápido", "Serviços técnicos organizados", "Atendimento local confiável", "Contato fácil em situações urgentes"];
  }

  if (niche.toLowerCase().includes("clínica")) {
    return ["Visual limpo e confiável", "Agendamento facilitado", "Informações claras", "Experiência mobile profissional"];
  }

  return ["Atendimento direto", "Informações organizadas", "Localização em destaque", "Presença online moderna"];
}
