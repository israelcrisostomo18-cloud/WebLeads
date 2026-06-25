import { NextResponse } from "next/server";
import type { BusinessLead } from "@/types";

export const runtime = "nodejs";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";
const CLAUDE_TIMEOUT_MS = 60_000;

type GenerateSiteHtmlBody = {
  lead?: Partial<BusinessLead>;
};

function sanitizeText(value: unknown, fallback = "") {
  return String(value ?? fallback)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 900);
}

function normalizeLead(rawLead: Partial<BusinessLead> | undefined) {
  return {
    name: sanitizeText(rawLead?.name, "Empresa local"),
    niche: sanitizeText(rawLead?.niche ?? rawLead?.category, "negócio local"),
    category: sanitizeText(rawLead?.category ?? rawLead?.niche, "negócio local"),
    address: sanitizeText(rawLead?.address, "Endereço não informado"),
    phone: sanitizeText(rawLead?.phone, ""),
    city: sanitizeText(rawLead?.city, ""),
    state: sanitizeText(rawLead?.state, ""),
    latitude: Number(rawLead?.latitude),
    longitude: Number(rawLead?.longitude),
  };
}

function buildPrompt(lead: ReturnType<typeof normalizeLead>) {
  const location = [lead.city, lead.state].filter(Boolean).join(" - ") || "Brasil";

  return `Você é um designer e copywriter especialista em landing pages para negócios locais brasileiros.

Crie um arquivo HTML completo, pronto para venda, para a empresa abaixo:

Nome da empresa: ${lead.name}
Nicho/tipo de negócio: ${lead.niche}
Categoria OSM: ${lead.category}
Endereço: ${lead.address}
Telefone/WhatsApp: ${lead.phone || "não informado"}
Localização: ${location}

Regras obrigatórias:
- Responda somente com HTML completo, começando por <!DOCTYPE html>.
- Não use Markdown, não use crase, não explique nada.
- Todo CSS deve estar dentro de uma tag <style> no próprio HTML.
- Não use scripts externos, imagens externas, fontes externas, CDN, tracking ou JavaScript obrigatório.
- O site deve ser responsivo e bonito no celular.
- Use português do Brasil.
- Não invente telefone se não foi informado.
- Se não houver telefone, deixe CTA para "Solicitar atendimento".
- Use cores modernas e adequadas ao nicho.
- A página deve ter header, hero, sobre nós, serviços com 3 a 5 itens, contato e footer.
- Inclua endereço e telefone quando disponíveis.
- Faça textos personalizados para o nicho, com tom profissional e comercial.
- O HTML precisa funcionar sozinho ao ser salvo como .html.`;
}

function extractText(content: unknown) {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (item && typeof item === "object" && "type" in item && item.type === "text" && "text" in item) {
        return String(item.text ?? "");
      }

      return "";
    })
    .join("")
    .trim();
}

function cleanHtml(value: string) {
  const withoutFence = value
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("<!DOCTYPE html");
  const htmlStart = start >= 0 ? start : withoutFence.toLowerCase().indexOf("<html");

  return (htmlStart >= 0 ? withoutFence.slice(htmlStart) : withoutFence).trim();
}

function fallbackHtml(lead: ReturnType<typeof normalizeLead>) {
  const location = [lead.city, lead.state].filter(Boolean).join(" - ");
  const phoneLine = lead.phone ? `<p><strong>WhatsApp:</strong> ${lead.phone}</p>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${lead.name} | ${lead.niche}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #172033; background: #f6f8fb; }
    header, section, footer { padding: 32px 20px; }
    .wrap { max-width: 1040px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #0f766e, #164e63); color: white; padding: 72px 20px; }
    h1 { font-size: clamp(34px, 7vw, 62px); line-height: 1; margin: 0 0 18px; }
    h2 { font-size: 28px; margin: 0 0 16px; color: #0f172a; }
    p { font-size: 17px; line-height: 1.7; }
    .button { display: inline-block; margin-top: 18px; padding: 14px 20px; border-radius: 10px; background: #22c55e; color: #052e16; font-weight: 800; text-decoration: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
    footer { background: #0f172a; color: #dbeafe; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <strong>${lead.niche}</strong>
      <h1>${lead.name}</h1>
      <p>Atendimento profissional, informações claras e contato direto para quem procura ${lead.niche} em ${location || "sua região"}.</p>
      <a class="button" href="#contato">Solicitar atendimento</a>
    </div>
  </header>
  <section>
    <div class="wrap">
      <h2>Sobre nós</h2>
      <p>A ${lead.name} oferece uma experiência prática e confiável para clientes que valorizam bom atendimento, organização e agilidade.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      <h2>Serviços</h2>
      <div class="grid">
        <div class="card">Atendimento especializado</div>
        <div class="card">Orçamento pelo WhatsApp</div>
        <div class="card">Informações completas para novos clientes</div>
        <div class="card">Localização fácil e contato direto</div>
      </div>
    </div>
  </section>
  <section id="contato">
    <div class="wrap card">
      <h2>Contato</h2>
      <p><strong>Endereço:</strong> ${lead.address}</p>
      ${phoneLine}
    </div>
  </section>
  <footer>
    <div class="wrap">${lead.name} - ${lead.niche}</div>
  </footer>
</body>
</html>`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateSiteHtmlBody;
  const lead = normalizeLead(body.lead);

  if (!lead.name) {
    return NextResponse.json({ error: "Lead inválido para gerar site." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;

  console.log("ANTHROPIC_API_KEY exists:", Boolean(apiKey));
  console.log("Generating Claude HTML for:", lead.name);

  if (!apiKey) {
    return NextResponse.json(
      {
        html: fallbackHtml(lead),
        warning: "Configuração da IA pendente. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente.",
        model: "fallback",
        source: "fallback",
      },
      { status: 200 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": ANTHROPIC_VERSION,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        max_tokens: 6000,
        temperature: 0.7,
        messages: [{ role: "user", content: buildPrompt(lead) }],
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Claude HTML generation failed:", {
        status: response.status,
        type: payload?.error?.type,
        message: payload?.error?.message,
      });

      return NextResponse.json(
        {
          html: fallbackHtml(lead),
          warning: "Não foi possível gerar com Claude agora. Usamos um modelo básico para você continuar.",
          model,
          source: "fallback",
        },
        { status: 200 },
      );
    }

    const html = cleanHtml(extractText(payload?.content));

    if (!html || !/<html[\s>]/i.test(html)) {
      return NextResponse.json(
        {
          html: fallbackHtml(lead),
          warning: "A IA retornou um HTML inválido. Usamos um modelo básico para você continuar.",
          model,
          source: "fallback",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ html, model, source: "claude" });
  } catch (error) {
    console.error("Claude HTML generation error:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        html: fallbackHtml(lead),
        warning: "Não foi possível gerar a landing page agora. Tente novamente.",
        model,
        source: "fallback",
      },
      { status: 200 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
