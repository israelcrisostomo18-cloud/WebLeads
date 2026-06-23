const servicesByNiche: Record<string, string[]> = {
  barbearia: ["Corte masculino", "Barba alinhada", "Acabamento", "Sobrancelha", "Atendimento com hora marcada", "Pacotes de cuidado pessoal"],
  padaria: ["Pães frescos", "Café da manhã", "Salgados", "Bolos e doces", "Encomendas", "Atendimento no balcão"],
  restaurante: ["Almoço", "Jantar", "Pedidos pelo WhatsApp", "Pratos da casa", "Bebidas", "Atendimento local"],
  "clínica odontológica": ["Avaliação odontológica", "Limpeza", "Restaurações", "Clareamento", "Tratamentos preventivos", "Agendamento pelo WhatsApp"],
  "oficina mecânica": ["Diagnóstico", "Troca de óleo", "Freios e suspensão", "Revisão preventiva", "Orçamento pelo WhatsApp", "Manutenção geral"],
  estética: ["Limpeza de pele", "Design de sobrancelhas", "Procedimentos faciais", "Avaliação estética", "Pacotes personalizados", "Agendamento online"],
  academia: ["Musculação", "Treino personalizado", "Avaliação física", "Planos mensais", "Acompanhamento", "Horários flexíveis"],
};

export function getGeneratedServicesByNiche(niche: string) {
  return servicesByNiche[niche.toLowerCase()] ?? ["Atendimento especializado", "Orçamento pelo WhatsApp", "Serviços sob consulta", "Atendimento local", "Informações organizadas", "Suporte direto"];
}
