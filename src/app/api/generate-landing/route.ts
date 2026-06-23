import OpenAI, { APIError } from "openai";
import { NextResponse } from "next/server";
import type {
  BusinessLead,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

export const runtime = "nodejs";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 45_000;

type GenerateLandingBody = {
  lead?: Partial<BusinessLead>;
  businessName?: string;
  name?: string;
  niche?: string;
  category?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string | null;
  website?: string | null;
  style?: {
    tone?: string;
    template?: string;
    colorPreference?: string;
  };
};

type AiLandingSection = {
  type: "benefits" | "services" | "about" | "contact";
  title: string;
  text: string;
  ctaText: string;
  items: string[];
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
  sections: AiLandingSection[];
  whatsappMessage: string;
  seo: {
    title: string;
    description: string;
  };
};

type OpenAIErrorInfo = {
  status: number;
  error: string;
  diagnosticCode: string;
};

const landingJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["businessName", "segment", "theme", "hero", "sections", "whatsappMessage", "seo"],
  properties: {
    businessName: { type: "string" },
    segment: { type: "string" },
    theme: {
      type: "object",
      additionalProperties: false,
      required: [
        "primaryColor",
        "secondaryColor",
        "backgroundColor",
        "textColor",
        "buttonColor",
        "buttonTextColor",
      ],
      properties: {
        primaryColor: { type: "string" },
        secondaryColor: { type: "string" },
        backgroundColor: { type: "string" },
        textColor: { type: "string" },
        buttonColor: { type: "string" },
        buttonTextColor: { type: "string" },
      },
    },
    hero: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "subheadline", "ctaText"],
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
        ctaText: { type: "string" },
      },
    },
    sections: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "text", "ctaText", "items"],
        properties: {
          type: { type: "string", enum: ["benefits", "services", "about", "contact"] },
          title: { type: "string" },
          text: { type: "string" },
          ctaText: { type: "string" },
          items: {
            type: "array",
            minItems: 0,
            maxItems: 6,
            items: { type: "string" },
          },
        },
      },
    },
    whatsappMessage: { type: "string" },
    seo: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
      },
    },
  },
} as const;

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

function safeId(value: unknown, fallback: string) {
  const text = sanitizeText(value, fallback);
  return text || fallback;
}

function getStringFromBody(body: GenerateLandingBody, keys: Array<keyof GenerateLandingBody>) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function normalizeLead(body: GenerateLandingBody): BusinessLead | null {
  const rawLead = body.lead ?? {};
  const name = sanitizeText(rawLead.name ?? getStringFromBody(body, ["businessName", "name"]));
  const city = sanitizeText(rawLead.city ?? body.city);

  if (!name || !city) {
    return null;
  }

  const fallbackId = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "lead";

  const latitude = Number(rawLead.latitude);
  const longitude = Number(rawLead.longitude);

  return {
    id: rawLead.id,
    source: rawLead.source ?? "osm",
    osmId: safeId(rawLead.osmId, fallbackId),
    osmType: rawLead.osmType === "way" || rawLead.osmType === "relation" ? rawLead.osmType : "node",
    name,
    address: sanitizeText(rawLead.address ?? body.address),
    phone: sanitizeText(rawLead.phone ?? body.phone) || null,
    email: sanitizeText(rawLead.email) || null,
    website: sanitizeText(rawLead.website ?? body.website) || null,
    category: sanitizeText(rawLead.category ?? body.category ?? body.niche) || null,
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    osmUrl: sanitizeText(rawLead.osmUrl) || "",
    city,
    state: sanitizeText(rawLead.state ?? body.state),
    niche: sanitizeText(rawLead.niche ?? body.niche ?? body.category) || "negócio local",
    hasWebsite: Boolean(rawLead.hasWebsite ?? rawLead.website ?? body.website),
    rawTags: rawLead.rawTags ?? {},
  };
}

function getSection(data: AiLandingData, type: AiLandingSection["type"]) {
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
        text: "",
        ctaText: "",
        items: ["Atendimento direto", "Informações claras", "Localização fácil", "Contato rápido pelo WhatsApp"],
      },
      {
        type: "services",
        title: "Serviços em destaque",
        text: "",
        ctaText: "",
        items: ["Atendimento local", "Orçamento pelo WhatsApp", "Serviços personalizados", "Suporte ao cliente"],
      },
      {
        type: "about",
        title: `Sobre ${lead.name}`,
        text: `${lead.name} atende clientes em ${lead.city} com foco em praticidade, clareza e contato direto.`,
        ctaText: "",
        items: [],
      },
      {
        type: "contact",
        title: "Fale agora",
        text: "Entre em contato para confirmar horários, serviços e disponibilidade.",
        ctaText: "Solicitar atendimento",
        items: [],
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
        text: sanitizeText(rawSection?.text, fallbackSection.text),
        ctaText: sanitizeText(rawSection?.ctaText, fallbackSection.ctaText),
        items: sanitizeItems(rawSection?.items, fallbackSection.items),
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

function classifyOpenAIError(error: unknown): OpenAIErrorInfo {
  const message = error instanceof Error ? error.message : String(error);

  if (error instanceof APIError) {
    if (error.status === 401) {
      return {
        status: 401,
        diagnosticCode: "openai_invalid_api_key",
        error: "A chave da OpenAI está inválida ou sem permissão. Confira a variável OPENAI_API_KEY na Vercel.",
      };
    }

    if (error.status === 429) {
      return {
        status: 429,
        diagnosticCode: "openai_rate_or_billing",
        error: "A OpenAI recusou a geração por limite, crédito ou billing. Verifique créditos e cobrança da conta.",
      };
    }

    if (error.status === 400 && /model|does not exist|access|permission/i.test(message)) {
      return {
        status: 400,
        diagnosticCode: "openai_model_invalid",
        error: "O modelo configurado para a OpenAI é inválido ou sua conta não tem acesso a ele.",
      };
    }

    return {
      status: error.status ?? 502,
      diagnosticCode: "openai_api_error",
      error: "A OpenAI retornou um erro ao gerar o site. Tente novamente em instantes.",
    };
  }

  if (/timeout|timed out|aborted/i.test(message)) {
    return {
      status: 504,
      diagnosticCode: "openai_timeout",
      error: "A geração demorou demais e foi interrompida. Tente novamente.",
    };
  }

  return {
    status: 500,
    diagnosticCode: "openai_unknown_error",
    error: "Não foi possível gerar a landing page com IA agora. Tente novamente.",
  };
}

async function parseRequestBody(request: Request) {
  try {
    return (await request.json()) as GenerateLandingBody;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  console.log("OPENAI_API_KEY exists:", Boolean(process.env.OPENAI_API_KEY));

  const body = await parseRequestBody(request);

  if (!body) {
    return NextResponse.json({ error: "Envie os dados do lead em JSON para gerar a landing page." }, { status: 400 });
  }

  const lead = normalizeLead(body);

  if (!lead) {
    return NextResponse.json(
      { error: "Lead inválido para gerar landing page. Informe pelo menos nome e cidade." },
      { status: 400 },
    );
  }

  console.log("Generating landing for:", lead.name);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "Configuração da IA pendente. Adicione a OPENAI_API_KEY nas variáveis de ambiente da Vercel e faça um novo deploy.",
        diagnosticCode: "openai_api_key_missing",
      },
      { status: 503 },
    );
  }

  const fallback = makeFallbackLanding(lead);
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS,
  });
  const model = process.env.OPENAI_LANDING_MODEL || DEFAULT_OPENAI_MODEL;
  const prompt = {
    lead: {
      name: sanitizeText(lead.name),
      category: sanitizeText(lead.category ?? lead.niche),
      address: sanitizeText(lead.address),
      city: sanitizeText(lead.city),
      state: sanitizeText(lead.state),
      phone: sanitizeText(lead.phone),
      website: sanitizeText(lead.website),
      hasWebsite: lead.hasWebsite,
    },
    style: body.style ?? { tone: "profissional", template: "auto", colorPreference: "auto" },
  };

  try {
    const response = await client.responses.create(
      {
        model,
        input: [
          {
            role: "system",
            content:
              "Você gera JSON seguro para landing pages de negócios locais. Não gere HTML, JavaScript, scripts, depoimentos com nomes reais inventados ou promessas falsas. Use textos comerciais honestos, CTA para WhatsApp, bom contraste e cores em hexadecimal.",
          },
          {
            role: "user",
            content: `Gere um objeto JSON válido para uma landing page de venda local. Use exatamente as seções benefits, services, about e contact. Dados do lead: ${JSON.stringify(prompt).slice(0, 3500)}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "webleads_landing_page",
            strict: true,
            schema: landingJsonSchema,
          },
        },
        max_output_tokens: 2200,
      },
      { timeout: OPENAI_TIMEOUT_MS },
    );

    if (!response.output_text) {
      throw new Error("OpenAI returned an empty response.");
    }

    let parsed: Partial<AiLandingData>;

    try {
      parsed = JSON.parse(response.output_text) as Partial<AiLandingData>;
    } catch (parseError) {
      console.error("OpenAI JSON parse error:", parseError);
      const landingData = normalizeLandingData(fallback, lead);

      return NextResponse.json({
        landingData,
        draft: landingDataToDraft(landingData, lead),
        source: "fallback",
        warning: "A IA respondeu fora do formato esperado. Geramos um template profissional padrão para você editar.",
        diagnosticCode: "openai_invalid_json",
      });
    }

    const landingData = normalizeLandingData(parsed, lead);

    return NextResponse.json({
      landingData,
      draft: landingDataToDraft(landingData, lead),
      source: "openai",
      model,
    });
  } catch (error) {
    console.error("OpenAI landing generation error:", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      status: error instanceof APIError ? error.status : undefined,
      code: error instanceof APIError ? error.code : undefined,
      type: error instanceof APIError ? error.type : undefined,
    });

    const info = classifyOpenAIError(error);

    return NextResponse.json(
      {
        error: info.error,
        diagnosticCode: info.diagnosticCode,
        source: "openai",
        model,
      },
      { status: info.status },
    );
  }
}
