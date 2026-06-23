import { getGeneratedBenefitsByNiche } from "@/lib/siteGenerator/benefitsByNiche";
import { getGeneratedAbout, getGeneratedDifferentials, getGeneratedHeadline, getGeneratedSubtitle } from "@/lib/siteGenerator/copyByNiche";
import { getGeneratedFAQByNiche, type GeneratedFAQ } from "@/lib/siteGenerator/faqByNiche";
import { getGeneratedServicesByNiche } from "@/lib/siteGenerator/servicesByNiche";
import type { BusinessLead } from "@/types";

export type GeneratedSiteContent = {
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  differentials: string[];
  faqs: GeneratedFAQ[];
  gallery: string[];
  ctaText: string;
  ctaFinal: string;
};

export function generateSiteContent(lead: Pick<BusinessLead, "name" | "niche" | "city">): GeneratedSiteContent {
  const services = getGeneratedServicesByNiche(lead.niche);
  const benefits = getGeneratedBenefitsByNiche(lead.niche);

  return {
    title: getGeneratedHeadline({ businessName: lead.name, niche: lead.niche, city: lead.city }),
    subtitle: getGeneratedSubtitle({ niche: lead.niche, city: lead.city }),
    description: getGeneratedAbout({ businessName: lead.name, niche: lead.niche, city: lead.city }),
    services,
    benefits,
    differentials: getGeneratedDifferentials(lead.niche),
    faqs: getGeneratedFAQByNiche(lead.niche),
    gallery: ["Ambiente", "Atendimento", "Serviços", "Localização"],
    ctaText: lead.niche.toLowerCase().includes("padaria") || lead.niche.toLowerCase().includes("restaurante") ? "Chamar no WhatsApp" : "Falar pelo WhatsApp",
    ctaFinal: `Fale com a ${lead.name} e receba atendimento direto pelo WhatsApp.`,
  };
}
