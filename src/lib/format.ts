import { getInitialProspectingMessage, getWhatsAppUrl } from "@/lib/messages/whatsappMessages";

export const WHATSAPP_MESSAGE = getInitialProspectingMessage();

export function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

export function makeWhatsappUrl(phone: string | null | undefined) {
  return getWhatsAppUrl(phone, WHATSAPP_MESSAGE);
}

export function formatAddress(tags: Record<string, string>) {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const suburb = tags["addr:suburb"];
  const city = tags["addr:city"];
  const parts = [
    street && number ? `${street}, ${number}` : street,
    suburb,
    city,
  ].filter(Boolean);

  return parts.join(" - ");
}
