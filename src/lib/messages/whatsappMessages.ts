export function getInitialProspectingMessage() {
  return `Olá, tudo bem?

Encontrei sua empresa no mapa e preparei um modelo de site profissional para mostrar como vocês poderiam ter uma presença online mais moderna, organizada e direta para receber clientes pelo WhatsApp.

O modelo já está pronto para visualização.

Posso te enviar o link?`;
}

export function getSiteReadyMessage(publicUrl: string) {
  return `Olá, tudo bem?

Encontrei sua empresa no mapa e preparei um modelo de site profissional para mostrar como vocês poderiam ter uma presença online mais moderna, organizada e direta para receber clientes pelo WhatsApp.

O modelo já está pronto para visualização:

${publicUrl}

Se fizer sentido para vocês, posso personalizar esse site com as cores, fotos, serviços, WhatsApp e informações da empresa.`;
}

export function getWhatsAppUrl(phone: string | null | undefined, message: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";

  if (digits.length < 10) {
    return null;
  }

  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
