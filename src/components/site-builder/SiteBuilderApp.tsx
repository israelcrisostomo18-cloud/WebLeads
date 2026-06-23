"use client";

import { ArrowLeft, Copy, Eye, FilePlus2, Loader2, MessageCircle, Save, Send } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BenefitsSection,
  FinalCTA,
  LandingFooter,
  LandingHero,
  LocationSection,
  ServicesSection,
  TrustSection,
  type LandingRenderData,
} from "@/components/landing/LandingBlocks";
import { makeLeadWhatsappUrl } from "@/lib/sites";
import { getInitialProspectingMessage, getSiteReadyMessage } from "@/lib/messages/whatsappMessages";
import { buildLandingVariations } from "@/templates/landing";
import type {
  BusinessLead,
  GeneratedSite,
  GeneratedSiteStatus,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

type SiteBuilderDraft = {
  templateType: LandingTemplateType;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  siteName: string;
  title: string;
  subtitle: string;
  description: string;
  services: string;
  benefits: string;
  questions: string;
  ctaText: string;
  ctaFinal: string;
  phone: string;
  address: string;
  primaryColor: string;
  accentColor: string;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
  showFaq: boolean;
  expiresInDays: 7 | 15 | 30;
  saleStatus: GeneratedSiteStatus;
  salePrice: string;
  finalPublishMode: "subdomain" | "custom_domain" | "temporary_domain" | "preview";
  customDomain: string;
  deliveryChecklist: Record<string, boolean>;
  deliveryNotes: string;
};

const SALE_STATUS_OPTIONS: Array<{ value: GeneratedSiteStatus; label: string }> = [
  { value: "rascunho", label: "rascunho" },
  { value: "enviado", label: "enviado ao cliente" },
  { value: "visualizado", label: "cliente visualizou" },
  { value: "aceito", label: "cliente aceitou" },
  { value: "aguardando_pagamento", label: "aguardando pagamento" },
  { value: "em_personalizacao", label: "em personalização" },
  { value: "publicado_definitivo", label: "publicado definitivo" },
  { value: "vendido", label: "vendido" },
  { value: "recusado", label: "recusado" },
];

const DELIVERY_ITEMS = [
  ["businessName", "nome final da empresa"],
  ["phone", "telefone/WhatsApp"],
  ["address", "endereço"],
  ["logo", "logo"],
  ["photos", "fotos"],
  ["services", "serviços"],
  ["colors", "cores"],
  ["domain", "domínio próprio"],
  ["social", "redes sociais"],
  ["payment", "forma de pagamento"],
] as const;

const SECTION_ORDER = [
  "hero",
  "trust",
  "services",
  "benefits",
  "about",
  "location",
  "middle-cta",
  "faq",
  "final-cta",
  "footer",
];

function questionsFor(lead: BusinessLead) {
  return [
    `Quais serviços a ${lead.name} oferece?|O site destaca os principais serviços de ${lead.niche} e facilita o contato direto.`,
    "Como entrar em contato?|Use o botão de WhatsApp para falar rapidamente com a empresa.",
    "Onde fica a empresa?|A seção de localização mostra endereço e mapa com OpenStreetMap.",
  ].join("\n");
}

function draftFromLead(lead: BusinessLead): SiteBuilderDraft {
  const variation = buildLandingVariations(lead)[0];

  return {
    templateType: variation.type,
    visualStyle: variation.visualStyle,
    buttonStyle: variation.buttonStyle,
    siteName: `${lead.name} - site modelo`,
    title: variation.title,
    subtitle: variation.subtitle,
    description: variation.description,
    services: variation.services.join("\n"),
    benefits: variation.benefits.join("\n"),
    questions: questionsFor(lead),
    ctaText: variation.ctaText,
    ctaFinal: variation.ctaFinal,
    phone: lead.phone ?? "",
    address: lead.address,
    primaryColor: variation.primaryColor,
    accentColor: variation.accentColor,
    showMap: true,
    showAbout: true,
    showBenefits: true,
    showFaq: true,
    expiresInDays: 7,
    saleStatus: "rascunho",
    salePrice: "",
    finalPublishMode: "preview",
    customDomain: "",
    deliveryChecklist: Object.fromEntries(DELIVERY_ITEMS.map(([key]) => [key, false])),
    deliveryNotes: "",
  };
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function parseQuestions(value: string) {
  return lines(value).map((item) => {
    const [question, answer] = item.split("|");
    return {
      question: question?.trim() || "Pergunta",
      answer: answer?.trim() || "Resposta curta e objetiva.",
    };
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
      {label}
      {children}
    </label>
  );
}

function makeMessage(link: string) {
  return link ? getSiteReadyMessage(link) : getInitialProspectingMessage();
}

function makeSalesProposal(link: string, price: string) {
  return `Oi, tudo bem? Esse é o modelo de site que preparei para sua empresa:
${link}

Se você gostar, eu posso deixar ele pronto com suas cores, WhatsApp, endereço, fotos, serviços e domínio próprio.

O valor para ativar e personalizar esse site é R$${price || "___"}.
Posso finalizar para você?`;
}

export function SiteBuilderApp({ businessId }: { businessId: string }) {
  const initialLead = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = sessionStorage.getItem(`site-builder:${businessId}`);
    return stored ? (JSON.parse(stored) as BusinessLead) : null;
  }, [businessId]);
  const [lead] = useState<BusinessLead | null>(initialLead);
  const [draft, setDraft] = useState<SiteBuilderDraft | null>(() => (initialLead ? draftFromLead(initialLead) : null));
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [savedSite, setSavedSite] = useState<GeneratedSite | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variations = useMemo(() => (lead ? buildLandingVariations(lead) : []), [lead]);
  const services = lines(draft?.services ?? "");
  const benefits = lines(draft?.benefits ?? "");
  const faqs = parseQuestions(draft?.questions ?? "");
  const publicLink = savedSite?.publicUrl ?? "";
  const whatsappMessage = lead ? makeMessage(publicLink) : "";
  const salesProposal = publicLink ? makeSalesProposal(publicLink, draft?.salePrice ?? "") : "";
  const whatsappUrl = lead ? makeLeadWhatsappUrl(draft?.phone || lead.phone, whatsappMessage) : null;
  const salesWhatsappUrl = lead ? makeLeadWhatsappUrl(draft?.phone || lead.phone, salesProposal) : null;

  const renderData: LandingRenderData | null = lead && draft ? {
    businessName: lead.name,
    niche: lead.niche,
    city: lead.city,
    title: draft.title,
    subtitle: draft.subtitle,
    description: draft.description,
    services,
    benefits,
    ctaText: draft.ctaText,
    ctaFinal: draft.ctaFinal,
    phone: draft.phone || null,
    address: draft.address,
    latitude: lead.latitude,
    longitude: lead.longitude,
    osmUrl: lead.osmUrl,
    primaryColor: draft.primaryColor,
    accentColor: draft.accentColor,
    visualStyle: draft.visualStyle,
    buttonStyle: draft.buttonStyle,
    showMap: draft.showMap,
    showAbout: draft.showAbout,
    showBenefits: draft.showBenefits,
    whatsappUrl: whatsappUrl ?? null,
  } : null;

  function update<K extends keyof SiteBuilderDraft>(key: K, value: SiteBuilderDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  }

  function chooseTemplate(type: LandingTemplateType) {
    if (!lead) return;
    const variation = variations.find((item) => item.type === type) ?? variations[0];
    setDraft((current) => current ? {
      ...current,
      templateType: variation.type,
      visualStyle: variation.visualStyle,
      buttonStyle: variation.buttonStyle,
      title: variation.title,
      subtitle: variation.subtitle,
      description: variation.description,
      services: variation.services.join("\n"),
      benefits: variation.benefits.join("\n"),
      ctaText: variation.ctaText,
      ctaFinal: variation.ctaFinal,
      primaryColor: variation.primaryColor,
      accentColor: variation.accentColor,
    } : current);
    setDirty(true);
  }

  async function publishSite() {
    if (!lead || !draft) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/generated-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: lead,
          templateType: draft.templateType,
          visualStyle: draft.visualStyle,
          buttonStyle: draft.buttonStyle,
          title: draft.title,
          subtitle: draft.subtitle,
          description: draft.description,
          services,
          benefits,
          questions: faqs,
          ctaText: draft.ctaText,
          ctaFinal: draft.ctaFinal,
          phone: draft.phone || null,
          address: draft.address,
          primaryColor: draft.primaryColor,
          accentColor: draft.accentColor,
          showMap: draft.showMap,
          showAbout: draft.showAbout,
          showBenefits: draft.showBenefits,
          showFaq: draft.showFaq,
          siteName: draft.siteName,
          expiresInDays: draft.expiresInDays,
          status: "publicado",
          saleStatus: draft.saleStatus,
          salePrice: draft.salePrice,
          finalPublishMode: draft.finalPublishMode,
          customDomain: draft.customDomain,
          deliveryChecklist: draft.deliveryChecklist,
          deliveryNotes: draft.deliveryNotes,
        }),
      });
      const payload = (await response.json()) as { site?: GeneratedSite; error?: string };

      if (!response.ok || !payload.site) {
        throw new Error(payload.error ?? "Não foi possível publicar o site.");
      }

      setSavedSite(payload.site);
      setDirty(false);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Erro inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyLink() {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function copyProposal() {
    if (!salesProposal) return;
    await navigator.clipboard.writeText(salesProposal);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function markAccepted() {
    update("saleStatus", "aceito");

    if (!savedSite) {
      return;
    }

    await fetch(`/api/generated-sites/${savedSite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "aceito" }),
    });
    setSavedSite({ ...savedSite, status: "aceito" });
  }

  function toggleChecklist(key: string, checked: boolean) {
    setDraft((current) =>
      current
        ? {
            ...current,
            deliveryChecklist: {
              ...current.deliveryChecklist,
              [key]: checked,
            },
          }
        : current,
    );
    setDirty(true);
  }

  if (!lead || !draft || !renderData) {
    return (
      <main className="premium-shell grid min-h-screen place-items-center p-6 text-center">
        <div className="premium-panel max-w-lg rounded-2xl p-8">
          <h1 className="text-2xl font-black text-white">Lead não encontrado</h1>
          <p className="mt-3 text-[#95a7bd]">Volte ao mapa, escolha uma empresa e clique em Gerar Site.</p>
          <Link className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#6ee7ff] px-4 font-bold text-[#06101d]" href="/">
            Voltar ao mapa
          </Link>
        </div>
      </main>
    );
  }

  const previewWidth = previewMode === "mobile" ? "max-w-[390px]" : previewMode === "tablet" ? "max-w-[760px]" : "max-w-6xl";

  return (
    <main className="premium-shell min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070a12]/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link className="grid size-10 place-items-center rounded-lg border border-[#6ee7ff]/20 bg-white/5 text-[#dceeff]" href="/">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase text-[#6ee7ff]">Editor de Site</p>
              <h1 className="text-lg font-black text-white">{lead.name}</h1>
              <p className="text-xs text-[#95a7bd]">{lead.niche} · {lead.city} · {lead.source ?? "osm"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#6ee7ff]/20 bg-white/5 px-3 py-2 text-xs font-bold text-[#dceeff]">
              {dirty ? "alterações não salvas" : savedSite?.status ?? "rascunho"}
            </span>
            <button className="lead-action" onClick={() => setDirty(false)}>
              <Save className="size-4" />
              Salvar
            </button>
            <button className="lead-action" onClick={() => setPreviewMode(previewMode === "desktop" ? "mobile" : "desktop")}>
              <Eye className="size-4" />
              Pré-visualizar
            </button>
            <button className="lead-action border-[#6ee7ff]/32 bg-[#21d4fd] text-[#06101d]" disabled={isSaving} onClick={publishSite}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
              Publicar link temporário
            </button>
            <button className="lead-action" disabled={!publicLink} onClick={copyLink}>
              <Copy className="size-4" />
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <button className="lead-action" disabled={!publicLink} onClick={copyProposal}>
              <Copy className="size-4" />
              Copiar proposta
            </button>
            {salesWhatsappUrl ? (
              <a className="lead-action border-[#20b15a]/30 bg-[#20b15a]/18 text-[#d7ffe5]" href={salesWhatsappUrl} rel="noreferrer">
                <Send className="size-4" />
                Enviar proposta
              </a>
            ) : null}
            <button className="lead-action" onClick={markAccepted}>
              Cliente aceitou
            </button>
            {whatsappUrl ? (
              <a className="lead-action border-[#20b15a]/30 bg-[#20b15a]/18 text-[#d7ffe5]" href={whatsappUrl} rel="noreferrer">
                <Send className="size-4" />
                Enviar no WhatsApp
              </a>
            ) : (
              <button className="lead-action" disabled={!whatsappMessage} onClick={() => navigator.clipboard.writeText(whatsappMessage)}>
                <MessageCircle className="size-4" />
                Copiar mensagem
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-4 p-4 xl:grid-cols-[310px_1fr_340px]">
        <aside className="premium-panel scroll-stable max-h-[calc(100vh-96px)] overflow-y-auto rounded-2xl p-4">
          <h2 className="font-black text-white">Modelos</h2>
          <div className="mt-3 grid gap-2">
            {variations.map((variation) => (
              <button
                key={variation.type}
                className={`rounded-xl border p-3 text-left transition-colors ${draft.templateType === variation.type ? "border-[#6ee7ff]/55 bg-[#6ee7ff]/12" : "border-[#6ee7ff]/16 bg-white/5 hover:bg-white/10"}`}
                onClick={() => chooseTemplate(variation.type)}
              >
                <div className="text-sm font-bold text-white">{variation.name}</div>
                <div className="mt-1 text-xs text-[#95a7bd]">{variation.objective}</div>
              </button>
            ))}
          </div>

          <div className="premium-divider my-5" />
          <h2 className="font-black text-white">Visual</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Cor principal"><input className="field h-11" type="color" value={draft.primaryColor} onChange={(event) => update("primaryColor", event.target.value)} /></Field>
            <Field label="Cor secundária"><input className="field h-11" type="color" value={draft.accentColor} onChange={(event) => update("accentColor", event.target.value)} /></Field>
            <Field label="Tema">
              <select className="field" value={draft.visualStyle} onChange={(event) => update("visualStyle", event.target.value as LandingVisualStyle)}>
                <option value="claro">Profissional claro</option>
                <option value="escuro">Premium escuro</option>
                <option value="minimalista">Minimalista</option>
                <option value="gradiente">Conversão</option>
                <option value="cartao">Local em cartões</option>
              </select>
            </Field>
            <Field label="Botão">
              <select className="field" value={draft.buttonStyle} onChange={(event) => update("buttonStyle", event.target.value as LandingButtonStyle)}>
                <option value="primary">Primário</option>
                <option value="secondary">Secundário</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="premium">Premium neon</option>
              </select>
            </Field>
            <Field label="Validade do link">
              <select className="field" value={draft.expiresInDays} onChange={(event) => update("expiresInDays", Number(event.target.value) as 7 | 15 | 30)}>
                <option value={7}>7 dias</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </Field>
          </div>

          <div className="premium-divider my-5" />
          <h2 className="font-black text-white">Seções</h2>
          <div className="mt-3 grid gap-2 text-sm text-[#dceeff]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showAbout} onChange={(event) => update("showAbout", event.target.checked)} /> Sobre</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showBenefits} onChange={(event) => update("showBenefits", event.target.checked)} /> Benefícios</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showMap} onChange={(event) => update("showMap", event.target.checked)} /> Localização</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showFaq} onChange={(event) => update("showFaq", event.target.checked)} /> Perguntas rápidas</label>
          </div>
          <p className="mt-3 text-xs text-[#7f93aa]">Ordem atual: {SECTION_ORDER.join(" → ")}</p>
        </aside>

        <section className="premium-panel min-h-[70vh] rounded-2xl p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-white">Preview em tempo real</h2>
            <div className="flex gap-2">
              {(["desktop", "tablet", "mobile"] as const).map((mode) => (
                <button key={mode} className={`rounded-md px-3 py-1 text-xs font-bold ${previewMode === mode ? "bg-[#6ee7ff] text-[#06101d]" : "bg-white/5 text-[#dceeff]"}`} onClick={() => setPreviewMode(mode)}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="scroll-stable max-h-[calc(100vh-170px)] overflow-y-auto rounded-xl bg-[#e8edf5] p-4">
            <div className={`mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl ${previewWidth}`}>
              <LandingHero data={renderData} />
              <TrustSection data={renderData} />
              {draft.showAbout ? (
                <section className="px-5 py-10 md:px-10">
                  <div className="mx-auto max-w-6xl rounded-2xl border border-[#d9ddd2] bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-black">Sobre {lead.name}</h2>
                    <p className="mt-3 leading-8 text-[#50594b]">{draft.description}</p>
                  </div>
                </section>
              ) : null}
              <ServicesSection data={renderData} />
              <BenefitsSection data={renderData} />
              <section className="px-5 py-10 md:px-10">
                <div className="mx-auto max-w-6xl rounded-2xl border border-[#d9ddd2] bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-black">Diferenciais</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {["Atendimento prático", "Comunicação rápida", "Presença online profissional"].map((item) => (
                      <div key={item} className="rounded-xl bg-[#f8faf6] p-4 text-sm font-bold">{item}</div>
                    ))}
                  </div>
                </div>
              </section>
              <LocationSection data={renderData} />
              {draft.showFaq ? (
                <section className="px-5 py-10 md:px-10">
                  <div className="mx-auto max-w-6xl rounded-2xl border border-[#d9ddd2] bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-black">Perguntas rápidas</h2>
                    <div className="mt-4 grid gap-3">
                      {faqs.map((faq) => (
                        <details key={faq.question} className="rounded-xl bg-[#f8faf6] p-4">
                          <summary className="cursor-pointer font-bold">{faq.question}</summary>
                          <p className="mt-2 text-sm text-[#50594b]">{faq.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
              <FinalCTA data={renderData} />
              <LandingFooter data={renderData} />
            </div>
          </div>
        </section>

        <aside className="premium-panel scroll-stable max-h-[calc(100vh-96px)] overflow-y-auto rounded-2xl p-4">
          <h2 className="font-black text-white">Conteúdo</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Status da venda">
              <select className="field" value={draft.saleStatus} onChange={(event) => update("saleStatus", event.target.value as GeneratedSiteStatus)}>
                {SALE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nome do site"><input className="field" value={draft.siteName} onChange={(event) => update("siteName", event.target.value)} /></Field>
            <Field label="Título principal"><textarea className="field min-h-24" value={draft.title} onChange={(event) => update("title", event.target.value)} /></Field>
            <Field label="Subtítulo"><textarea className="field min-h-24" value={draft.subtitle} onChange={(event) => update("subtitle", event.target.value)} /></Field>
            <Field label="Texto sobre"><textarea className="field min-h-32" value={draft.description} onChange={(event) => update("description", event.target.value)} /></Field>
            <Field label="Serviços"><textarea className="field min-h-32" value={draft.services} onChange={(event) => update("services", event.target.value)} /></Field>
            <Field label="Benefícios"><textarea className="field min-h-32" value={draft.benefits} onChange={(event) => update("benefits", event.target.value)} /></Field>
            <Field label="Perguntas e respostas"><textarea className="field min-h-32" value={draft.questions} onChange={(event) => update("questions", event.target.value)} /></Field>
            <Field label="CTA principal"><input className="field" value={draft.ctaText} onChange={(event) => update("ctaText", event.target.value)} /></Field>
            <Field label="CTA final"><textarea className="field min-h-20" value={draft.ctaFinal} onChange={(event) => update("ctaFinal", event.target.value)} /></Field>
            <Field label="WhatsApp"><input className="field" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></Field>
            <Field label="Endereço"><textarea className="field min-h-20" value={draft.address} onChange={(event) => update("address", event.target.value)} /></Field>
          </div>
          <Field label="Valor para ativar e personalizar"><input className="field mt-3" placeholder="Ex: 497,00" value={draft.salePrice} onChange={(event) => update("salePrice", event.target.value)} /></Field>

          <div className="premium-divider my-5" />
          <h2 className="font-black text-white">Checklist de entrega</h2>
          <div className="mt-3 grid gap-2 text-sm text-[#dceeff]">
            {DELIVERY_ITEMS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-[#6ee7ff]/12 bg-white/5 p-2">
                <input checked={Boolean(draft.deliveryChecklist[key])} type="checkbox" onChange={(event) => toggleChecklist(key, event.target.checked)} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Observações"><textarea className="field mt-3 min-h-24" value={draft.deliveryNotes} onChange={(event) => update("deliveryNotes", event.target.value)} /></Field>

          <div className="premium-divider my-5" />
          <h2 className="font-black text-white">Publicação final</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Modo de publicação">
              <select className="field" value={draft.finalPublishMode} onChange={(event) => update("finalPublishMode", event.target.value as SiteBuilderDraft["finalPublishMode"])}>
                <option value="subdomain">manter no subdomínio do sistema</option>
                <option value="custom_domain">conectar domínio próprio do cliente</option>
                <option value="temporary_domain">usar domínio temporário</option>
                <option value="preview">deixar como preview</option>
              </select>
            </Field>
            <Field label="Domínio próprio"><input className="field" placeholder="barbeariadojoao.com.br" value={draft.customDomain} onChange={(event) => update("customDomain", event.target.value)} /></Field>
            <div className="rounded-lg border border-[#6ee7ff]/16 bg-white/5 p-3 text-xs leading-5 text-[#95a7bd]">
              Para domínio próprio, configure o DNS apontando para a Vercel ou hospedagem usada no projeto.
            </div>
          </div>

          {error ? <div className="mt-4 rounded-lg border border-[#f472b6]/35 bg-[#f472b6]/12 p-3 text-sm text-[#ffd4e8]">{error}</div> : null}
          {publicLink ? (
            <div className="mt-4 rounded-lg border border-[#6ee7ff]/20 bg-white/5 p-3 text-sm text-[#dceeff]">
              <div className="font-bold text-white">Link temporário publicado</div>
              <div className="mt-2 break-all text-[#95a7bd]">{publicLink}</div>
              {!whatsappUrl ? <div className="mt-2 text-[#ffd4e8]">Este lead não possui telefone cadastrado. Copie a mensagem e envie manualmente.</div> : null}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
