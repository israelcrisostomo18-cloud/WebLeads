export type GeneratedFAQ = {
  question: string;
  answer: string;
};

const faqByNiche: Record<string, GeneratedFAQ[]> = {
  barbearia: [
    { question: "Precisa agendar horario?", answer: "O ideal é chamar no WhatsApp para confirmar disponibilidade e escolher o melhor horário." },
    { question: "Quais serviços posso pedir?", answer: "Corte, barba, acabamento e outros serviços podem ser confirmados diretamente com a equipe." },
    { question: "O atendimento é na região?", answer: "Sim. A página destaca endereço e localização para facilitar a visita." },
  ],
  padaria: [
    { question: "Posso fazer encomendas?", answer: "Chame no WhatsApp para consultar produtos, prazos e disponibilidade." },
    { question: "Quais produtos estão em destaque?", answer: "Pães, salgados, bolos, doces e itens de balcão podem ser apresentados no site." },
    { question: "Onde fica a padaria?", answer: "A seção de localização mostra o endereço e o mapa para chegar com facilidade." },
  ],
  "clínica odontológica": [
    { question: "Como agendar avaliação?", answer: "Use o botão de WhatsApp para falar com a clínica e verificar horários disponíveis." },
    { question: "Quais tratamentos aparecem no site?", answer: "A página organiza os serviços principais de forma simples e profissional." },
    { question: "O site substitui orientação profissional?", answer: "Não. Ele facilita o contato; qualquer diagnóstico deve ser feito pela clínica." },
  ],
};

export function getGeneratedFAQByNiche(niche: string): GeneratedFAQ[] {
  return faqByNiche[niche.toLowerCase()] ?? [
    { question: "Como entro em contato?", answer: "Use o botão de WhatsApp para falar diretamente com a empresa." },
    { question: "Onde fica a empresa?", answer: "A seção de localização mostra endereço e mapa com acesso rápido." },
    { question: "Quais serviços estão disponíveis?", answer: "Os principais serviços aparecem organizados no site e podem ser confirmados no contato." },
  ];
}
