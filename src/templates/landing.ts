import { generateSiteContent } from "@/lib/siteGenerator/generateSiteContent";
import { getThemePresetByNiche } from "@/lib/siteThemes/themesByNiche";
import { sitePalettes } from "@/lib/siteThemes/palettes";
import type { BusinessLead, LandingButtonStyle, LandingTemplateType, LandingVisualStyle } from "@/types";

export type LandingVariation = {
  type: LandingTemplateType;
  name: string;
  objective: string;
  bestFor: string;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  ctaText: string;
  ctaFinal: string;
  primaryColor: string;
  accentColor: string;
};

function ctaFor(niche: string) {
  const lower = niche.toLowerCase();

  if (lower.includes("padaria") || lower.includes("restaurante") || lower.includes("pizzaria") || lower.includes("hamburgueria")) {
    return "Fazer pedido pelo WhatsApp";
  }

  if (lower.includes("oficina") || lower.includes("borracharia")) {
    return "Pedir orçamento agora";
  }

  if (lower.includes("clínica") || lower.includes("estética") || lower.includes("barbearia") || lower.includes("salão")) {
    return "Agendar pelo WhatsApp";
  }

  return "Chamar no WhatsApp";
}

export function buildLandingVariations(lead: BusinessLead): LandingVariation[] {
  const content = generateSiteContent(lead);
  const preset = getThemePresetByNiche(lead.niche);
  const palette = sitePalettes[preset.paletteKey];
  const cta = content.ctaText || ctaFor(lead.niche);

  return [
    {
      type: "profissional",
      name: "Profissional Local",
      objective: "Confiança, organização e credibilidade.",
      bestFor: "Empresas tradicionais que precisam parecer mais confiáveis no celular.",
      visualStyle: preset.visualStyle,
      buttonStyle: preset.buttonStyle,
      title: content.title,
      subtitle: content.subtitle,
      description: content.description,
      services: content.services,
      benefits: content.benefits,
      ctaText: cta,
      ctaFinal: content.ctaFinal,
      primaryColor: palette.primary,
      accentColor: palette.accent,
    },
    {
      type: "oferta",
      name: "Conversão WhatsApp",
      objective: "Gerar contato rápido pelo WhatsApp.",
      bestFor: "Serviços que vendem por orçamento, pedido ou agendamento.",
      visualStyle: "gradiente",
      buttonStyle: "whatsapp",
      title: `${lead.name}: atendimento rápido pelo WhatsApp`,
      subtitle: `Serviços, localização e contato em uma página direta para clientes de ${lead.city || "sua região"}.`,
      description: content.description,
      services: content.services.slice(0, 5),
      benefits: ["Contato em poucos segundos", "Informações fáceis de entender", "Atendimento local", ...content.benefits.slice(0, 3)],
      ctaText: cta,
      ctaFinal: `Clique no botão e fale com a ${lead.name} agora.`,
      primaryColor: palette.secondary,
      accentColor: palette.accent,
    },
    {
      type: "premium",
      name: "Premium Moderno",
      objective: "Parecer maior, mais sofisticado e mais atual.",
      bestFor: "Empresas que já têm site ou querem uma presença online mais forte.",
      visualStyle: "escuro",
      buttonStyle: "premium",
      title: `${lead.name} com presença online moderna em ${lead.city || "sua região"}`,
      subtitle: "Um visual mais bonito, organizado e direto para WhatsApp, pensado para transformar visitas em contatos.",
      description: content.description,
      services: content.services,
      benefits: ["Visual premium e responsivo", "Foco em conversão para WhatsApp", "Autoridade para clientes locais", ...content.benefits.slice(0, 3)],
      ctaText: cta,
      ctaFinal: `Conheça os serviços da ${lead.name} e chame pelo WhatsApp.`,
      primaryColor: "#152238",
      accentColor: "#78dcca",
    },
  ];
}

export function getLandingVariation(lead: BusinessLead, type: LandingTemplateType) {
  return buildLandingVariations(lead).find((variation) => variation.type === type) ?? buildLandingVariations(lead)[0];
}
