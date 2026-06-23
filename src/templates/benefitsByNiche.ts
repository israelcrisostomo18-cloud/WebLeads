const fallbackBenefits = [
  "Atendimento direto pelo WhatsApp",
  "Localização fácil",
  "Informações organizadas em um só lugar",
  "Página rápida e responsiva",
  "Melhor presença online",
];

export const benefitsByNiche: Record<string, string[]> = {
  barbearia: ["Agendamento mais prático", "Estilo e cuidado nos detalhes", "Contato direto pelo WhatsApp", "Localização fácil"],
  padaria: ["Produtos frescos em destaque", "Pedidos e encomendas mais fáceis", "Atendimento rápido", "Clientes próximos encontram melhor"],
  "oficina mecânica": ["Orçamento mais rápido", "Mais praticidade para o cliente", "Serviços organizados", "Confiança para cuidar do veículo"],
  "clínica odontológica": ["Mais confiança para pacientes", "Consulta facilitada", "Serviços apresentados com clareza", "Presença profissional"],
  restaurante: ["Pedidos e reservas mais fáceis", "Cardápio e localização em destaque", "Contato rápido", "Mais clientes da região"],
  pizzaria: ["Mais pedidos diretos", "Promoções visíveis", "Contato fácil pelo WhatsApp", "Entrega local em destaque"],
  academia: ["Planos mais claros", "Mais matrículas", "Imagem profissional", "Contato direto para avaliação"],
  estética: ["Agenda mais movimentada", "Tratamentos valorizados", "Imagem premium", "Atendimento fácil"],
  "clínica de estética": ["Autoridade visual", "Mais agendamentos", "Serviços valorizados", "Contato direto"],
  "pet shop": ["Mais agendamentos", "Confiança para tutores", "Serviços pet organizados", "Contato rápido"],
  "loja de roupas": ["Vitrine online simples", "Mais visitas à loja", "Contato com clientes interessados", "Novidades em destaque"],
  "lava jato": ["Mais agendamentos", "Serviços claros", "Orçamento rápido", "Localização fácil"],
  imobiliária: ["Mais leads qualificados", "Autoridade local", "Contato profissional", "Imóveis e serviços organizados"],
  escola: ["Mais solicitações de matrícula", "Informações claras para famílias", "Credibilidade", "Visitas agendadas"],
  mercadinho: ["Pedidos locais facilitados", "Clientes de bairro encontram melhor", "Contato rápido", "Produtos em destaque"],
  igreja: ["Programação acessível", "Comunidade informada", "Localização fácil", "Acolhimento em destaque"],
  "assistência técnica": ["Mais orçamentos", "Confiança técnica", "Atendimento rápido", "Serviços organizados"],
  "loja de celular": ["Mais vendas", "Produtos e serviços em destaque", "Contato direto", "Atendimento pelo WhatsApp"],
  farmácia: ["Atendimento ágil", "Consulta de disponibilidade", "Localização visível", "Mais contatos"],
  ótica: ["Mais orçamentos", "Armações e lentes valorizadas", "Contato fácil", "Confiança visual"],
  "consultório médico": ["Presença profissional", "Agendamento facilitado", "Informações claras", "Mais confiança"],
  hamburgueria: ["Mais pedidos", "Combos em destaque", "Contato direto", "Página rápida no celular"],
  açaíteria: ["Mais pedidos", "Cardápio fácil", "Promoções em destaque", "Contato pelo WhatsApp"],
  "distribuidora de bebidas": ["Pedidos diretos", "Entrega local em destaque", "Combos visíveis", "Atendimento rápido"],
  "loja de material de construção": ["Mais orçamentos", "Produtos organizados", "Contato com obras da região", "Entrega local em destaque"],
  vidraçaria: ["Mais orçamentos", "Serviços sob medida valorizados", "Contato rápido", "Localização fácil"],
  borracharia: ["Atendimento emergencial visível", "Mais chamadas locais", "Serviços rápidos em destaque", "Localização fácil"],
  "oficina de moto": ["Mais motociclistas interessados", "Orçamento rápido", "Serviços claros", "Atendimento direto"],
  eletricista: ["Mais chamados", "Atendimento emergencial", "Confiança profissional", "Contato imediato"],
  encanador: ["Mais chamados locais", "Serviço urgente visível", "Contato rápido", "Orçamento facilitado"],
  advogado: ["Mais autoridade", "Contato profissional", "Serviços jurídicos claros", "Credibilidade online"],
  contador: ["Mais empresas interessadas", "Serviços contábeis claros", "Confiança profissional", "Contato direto"],
};

export function getBenefitsByNiche(niche: string) {
  return benefitsByNiche[niche] ?? fallbackBenefits;
}
