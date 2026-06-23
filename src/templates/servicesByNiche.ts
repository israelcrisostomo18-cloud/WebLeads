const fallbackServices = [
  "Atendimento local",
  "Orçamentos pelo WhatsApp",
  "Informações de contato",
  "Localização fácil",
  "Atendimento personalizado",
];

export const servicesByNiche: Record<string, string[]> = {
  barbearia: ["Corte masculino", "Barba", "Acabamento", "Sobrancelha", "Atendimento com horário marcado"],
  "salão de beleza": ["Corte e escova", "Coloração", "Tratamentos capilares", "Maquiagem", "Agendamento pelo WhatsApp"],
  "clínica odontológica": ["Avaliação", "Limpeza", "Clareamento", "Restauração", "Atendimento odontológico"],
  "oficina mecânica": ["Revisão", "Troca de óleo", "Diagnóstico", "Freios", "Suspensão"],
  restaurante: ["Almoço", "Jantar", "Delivery", "Pratos especiais", "Reservas"],
  pizzaria: ["Pizzas tradicionais", "Pizzas especiais", "Delivery", "Combos", "Pedidos pelo WhatsApp"],
  academia: ["Musculação", "Aulas coletivas", "Avaliação física", "Planos mensais", "Treinos orientados"],
  estética: ["Limpeza de pele", "Tratamentos faciais", "Tratamentos corporais", "Massagem", "Avaliação estética"],
  "clínica de estética": ["Tratamentos faciais", "Tratamentos corporais", "Limpeza de pele", "Avaliação personalizada", "Protocolos estéticos"],
  "pet shop": ["Banho e tosa", "Produtos pet", "Acessórios", "Agendamento", "Atendimento local"],
  "loja de roupas": ["Moda feminina", "Moda masculina", "Novidades", "Atendimento pelo WhatsApp", "Visita à loja"],
  "lava jato": ["Lavagem simples", "Lavagem completa", "Higienização", "Polimento", "Agendamento"],
  imobiliária: ["Compra e venda", "Locação", "Avaliação de imóveis", "Captação", "Atendimento consultivo"],
  escola: ["Matrículas", "Visitas agendadas", "Projetos pedagógicos", "Atendimento às famílias", "Informações da escola"],
  mercadinho: ["Produtos do dia a dia", "Bebidas", "Hortifruti", "Pedidos locais", "Atendimento de bairro"],
  igreja: ["Cultos", "Eventos", "Aconselhamento", "Programação semanal", "Acolhimento"],
  "assistência técnica": ["Conserto de eletrônicos", "Diagnóstico", "Orçamento", "Manutenção", "Atendimento técnico"],
  "loja de celular": ["Venda de celulares", "Acessórios", "Películas", "Manutenção", "Atendimento pelo WhatsApp"],
  farmácia: ["Medicamentos", "Perfumaria", "Consulta de disponibilidade", "Atendimento local", "Pedidos pelo WhatsApp"],
  ótica: ["Armações", "Lentes", "Ajustes", "Orçamentos", "Atendimento especializado"],
  padaria: ["Pães frescos", "Bolos", "Salgados", "Café da manhã", "Encomendas"],
  "consultório médico": ["Consultas", "Avaliação", "Acompanhamento", "Agendamento", "Atendimento humanizado"],
  hamburgueria: ["Hambúrgueres artesanais", "Combos", "Delivery", "Bebidas", "Pedidos pelo WhatsApp"],
  açaíteria: ["Açaí no copo", "Açaí na tigela", "Complementos", "Delivery", "Promoções"],
  "distribuidora de bebidas": ["Bebidas geladas", "Combos", "Entrega local", "Atacado", "Pedidos pelo WhatsApp"],
  "loja de material de construção": ["Materiais básicos", "Ferramentas", "Tintas", "Orçamentos", "Entrega local"],
  vidraçaria: ["Vidros sob medida", "Box", "Espelhos", "Instalação", "Orçamentos"],
  borracharia: ["Troca de pneus", "Conserto de furos", "Calibragem", "Alinhamento", "Atendimento emergencial"],
  "oficina de moto": ["Revisão de motos", "Troca de óleo", "Freios", "Elétrica", "Orçamento rápido"],
  eletricista: ["Instalações elétricas", "Manutenção", "Quadros elétricos", "Emergências", "Orçamentos"],
  encanador: ["Vazamentos", "Desentupimento", "Instalações", "Manutenção", "Atendimento emergencial"],
  advogado: ["Consultoria jurídica", "Atendimento inicial", "Contratos", "Direito civil", "Direito trabalhista"],
  contador: ["Abertura de empresa", "Contabilidade mensal", "Impostos", "Folha de pagamento", "Regularização"],
};

export function getServicesByNiche(niche: string) {
  return servicesByNiche[niche] ?? fallbackServices;
}
