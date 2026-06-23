const benefitsByNiche: Record<string, string[]> = {
  barbearia: ["Atendimento direto pelo WhatsApp", "Visual alinhado ao estilo do cliente", "Localização fácil", "Serviços apresentados com clareza"],
  padaria: ["Pedido mais prático", "Produtos destacados de forma organizada", "Contato rápido", "Informações úteis para clientes da região"],
  restaurante: ["Contato rápido para pedido ou reserva", "Cardápio e serviços fáceis de entender", "Localização em destaque", "Experiência simples no celular"],
  "clínica odontológica": ["Agendamento facilitado", "Informações claras para pacientes", "Visual limpo e confiável", "Contato direto pelo WhatsApp"],
  "oficina mecânica": ["Orçamento sem complicação", "Serviços técnicos bem apresentados", "Confiança para clientes locais", "Contato rápido em situações urgentes"],
};

export function getGeneratedBenefitsByNiche(niche: string) {
  return benefitsByNiche[niche.toLowerCase()] ?? ["Contato direto", "Informações organizadas", "Atendimento local", "Experiência rápida pelo celular"];
}
