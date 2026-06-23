import OpenAI from "openai";
import { NextResponse } from "next/server";
import type {
  BusinessLead,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

type GenerateLandingBody = {
  lead?: BusinessLead;
  style?: {
    tone?: string;
    template?: string;
    colorPreference?: string;
  };
};

type AiLandingData = {
  businessName: string;
  segment: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  sections: Array<{
    type: "benefits" | "services" | "about" | "testimonials" | "contact";
    title: string;
    text?: string;
    ctaText?: string;
    items?: string[];
  }>;
  whatsappMessage: string;
  seo: {
    title: string;
    description: string;
  };
};

function sanitizeText(value: unknown, fallback = "") {
  return String(value ?? fallback)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 900);
}

function sanitizeColor(value: unknown, fallback: string) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function sanitizeItems(items: unknown, fallback: string[]) {
  if (!Array.isArray(items)) {
    return fallback;
  }

  const cleaned = items.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 6);
  return cleaned.length ? cleaned : fallback;
}

function getSection(data: AiLandingData, type: AiLandingData["sections"][number]["type"]) {
  return data.sections.find((section) => section.type === type);
}

function makeFallbackLanding(lead: BusinessLead): AiLandingData {
  const niche = lead.niche || lead.category || "negócio local";

  return {
    businessName: lead.name,
    segment: niche,
    theme: {
      primaryColor: "#10243f",
      secondaryColor: "#21d4fd",
      backgroundColor: "#f6f8fb",
      textColor: "#111827",
      buttonColor: "#20b15a",
      buttonTextColor: "#ffffff",
    },
    hero: {
      headline: `${lead.name}: ${niche} com atendimento direto`,
      subheadline: `Uma página profissional para apresentar serviços, endereço e contato pelo WhatsApp em ${lead.city}.`,
      ctaText: "Chamar no WhatsApp",
    },
    sections: [
      {
        type: "benefits",
        title: "Por que escolher",
        items: ["Atendimento direto", "Informações claras", "Localização fácil", "Contato rápido pelo WhatsApp"],
      },
      {
        type: "services",
        title: "Serviços em destaque",
        items: ["Atendimento local", "Orçamento pelo WhatsApp", "Serviços personalizados", "Suporte ao cliente"],
      },
      {
        type: "about",
        title: `Sobre ${lead.name}`,
        text: `${lead.name} atende clientes em ${lead.city} com foco em praticidade, clareza e contato direto.`,
      },
      {
        type: "contact",
        title: "Fale agora",
        ctaText: "Solicitar atendimento",
      },
    ],
    whatsappMessage: `Olá, encontrei a ${lead.name} e gostaria de saber mais sobre os serviços.`,
    seo: {
      title: `${lead.name} | ${niche} em ${lead.city}`,
      description: `${lead.name} em ${lead.city}. Veja serviços, endereço e contato pelo WhatsApp.`,
    },
  };
}

function normalizeLandingData(raw: Partial<AiLandingData>, lead: BusinessLead): AiLandingData {
  const fallback = makeFallbackLanding(lead);

  return {
    businessName: sanitizeText(raw.businessName, fallback.businessName),
    segment: sanitizeText(raw.segment, fallback.segment),
    theme: {
      primaryColor: sanitizeColor(raw.theme?.primaryColor, fallback.theme.primaryColor),
      secondaryColor: sanitizeColor(raw.theme?.secondaryColor, fallback.theme.secondaryColor),
      backgroundColor: sanitizeColor(raw.theme?.backgroundColor, fallback.theme.backgroundColor),
      textColor: sanitizeColor(raw.theme?.textColor, fallback.theme.textColor),
      buttonColor: sanitizeColor(raw.theme?.buttonColor, fallback.theme.buttonColor),
      buttonTextColor: sanitizeColor(raw.theme?.buttonTextColor, fallback.theme.buttonTextColor),
    },
    hero: {
      headline: sanitizeText(raw.hero?.headline, fallback.hero.headline),
      subheadline: sanitizeText(raw.hero?.subheadline, fallback.hero.subheadline),
      ctaText: sanitizeText(raw.hero?.ctaText, fallback.hero.ctaText),
    },
    sections: fallback.sections.map((fallbackSection) => {
      const rawSection = raw.sections?.find((section) => section.type === fallbackSection.type);

      return {
        type: fallbackSection.type,
        title: sanitizeText(rawSection?.title, fallbackSection.title),
        text: sanitizeText(rawSection?.text, fallbackSection.text ?? ""),
        ctaText: sanitizeText(rawSection?.ctaText, fallbackSection.ctaText ?? ""),
        items: sanitizeItems(rawSection?.items, fallbackSection.items ?? []),
      };
    }),
    whatsappMessage: sanitizeText(raw.whatsappMessage, fallback.whatsappMessage),
    seo: {
      title: sanitizeText(raw.seo?.title, fallback.seo.title),
      description: sanitizeText(raw.seo?.description, fallback.seo.description),
    },
  };
}

function landingDataToDraft(data: AiLandingData, lead: BusinessLead) {
  const services = getSection(data, "services")?.items ?? [];
  const benefits = getSection(data, "benefits")?.items ?? [];
  const about = getSection(data, "about")?.text ?? data.hero.subheadline;
  const contact = getSection(data, "contact");

  return {
    templateType: "premium" as LandingTemplateType,
    visualStyle: "claro" as LandingVisualStyle,
    buttonStyle: "whatsapp" as LandingButtonStyle,
    title: data.hero.headline,
    subtitle: data.hero.subheadline,
    description: about,
    services,
    benefits,
    differentials: benefits.slice(0, 4),
    gallery: ["Atendimento", "Serviços", "Ambiente", "Localização"],
    questions: [
      {
        question: "Como faço para entrar em contato?",
        answer: "Use o botão de WhatsApp da página para falar diretamente com a empresa.",
      },
      {
        question: "Onde fica localizada a empresa?",
        answer: lead.address || `Atendimento em ${lead.city}. Confirme o endereço pelo WhatsApp.`,
      },
    ],
    ctaText: data.hero.ctaText,
    ctaFinal: contact?.ctaText || "Fale agora pelo WhatsApp.",
    phone: lead.phone,
    address: lead.address,
    primaryColor: data.theme.primaryColor,
    accentColor: data.theme.secondaryColor,
    showMap: true,
    showAbout: true,
    showBenefits: true,
    showFaq: true,
    siteName: `${lead.name} - landing IA`,
  };
}

function validateLead(lead: unknown): lead is BusinessLead {
  const candidate = lead as Partial<BusinessLead>;
  return Boolean(candidate?.name && candidate?.osmId && candidate?.osmType && candidate?.city);
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateLandingBody;

  if (!validateLead(body.lead)) {
    return NextResponse.json({ error: "Lead inválido para gerar landing page." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Configuração da IA pendente. Adicione a OPENAI_API_KEY nas variáveis de ambiente." },
      { status: 503 },
    );
  }

  const lead = body.lead;
  const fallback = makeFallbackLanding(lead);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = {
    lead: {
      name: sanitizeText(lead.name),
      category: sanitizeText(lead.category ?? lead.niche),
      address: sanitizeText(lead.address),
      city: sanitizeText(lead.city),
      phone: sanitizeText(lead.phone),
      website: sanitizeText(lead.website),
      hasWebsite: lead.hasWebsite,
    },
    style: body.style ?? { tone: "profissional", template: "auto", colorPreference: "auto" },
  };

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_LANDING_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Você gera JSON seguro para landing pages de negócios locais. Não gere HTML, JS, scripts, depoimentos com nomes reais inventados ou promessas falsas. Use textos comerciais honestos, CTA para WhatsApp, bom contraste e cores em hex.",
        },
        {
          role: "user",
          content: `Gere uma landing page em JSON válido seguindo exatamente este schema: ${JSON.stringify(fallback)}. Dados do lead: ${JSON.stringify(prompt).slice(0, 3500)}`,
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      max_output_tokens: 2200,
    });
    const rawText = response.output_text;
    const parsed = JSON.parse(rawText) as Partial<AiLandingData>;
    const landingData = normalizeLandingData(parsed, lead);

    return NextResponse.json({
      landingData,
      draft: landingDataToDraft(landingData, lead),
      source: "openai",
    });
  } catch {
    const landingData = normalizeLandingData(fallback, lead);

    return NextResponse.json({
      landingData,
      draft: landingDataToDraft(landingData, lead),
      source: "fallback",
      warning: "A IA falhou nesta tentativa. Geramos um template profissional padrão para você editar.",
    });
  }
}
