"use client";

import { Copy, FilePlus2, Loader2, Send, X } from "lucide-react";
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
import { QualityScoreCard } from "@/components/landing/QualityScoreCard";
import { TemplatePreviewCard } from "@/components/landing/TemplatePreviewCard";
import { makeLeadWhatsappUrl } from "@/lib/sites";
import type { LandingVariation } from "@/templates/landing";
import type {
  BusinessLead,
  GeneratedSite,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

export type PremiumSiteDraft = {
  templateType: LandingTemplateType;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  title: string;
  subtitle: string;
  description: string;
  services: string;
  benefits: string;
  ctaText: string;
  ctaFinal: string;
  phone: string;
  address: string;
  primaryColor: string;
  accentColor: string;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
};

export type PremiumGeneratorState = {
  lead: BusinessLead;
  variations: LandingVariation[];
  draft: PremiumSiteDraft;
  previewSite: GeneratedSite | null;
};

export function PremiumLandingGeneratorModal({
  generator,
  history,
  isSaving,
  copiedKey,
  onClose,
  onChooseVariation,
  onDraftChange,
  onSave,
  onCopy,
}: {
  generator: PremiumGeneratorState;
  history: GeneratedSite[];
  isSaving: boolean;
  copiedKey: string | null;
  onClose: () => void;
  onChooseVariation: (variation: LandingVariation) => void;
  onDraftChange: (draft: PremiumSiteDraft) => void;
  onSave: () => void;
  onCopy: (key: string, text: string) => void;
}) {
  const { lead, draft, previewSite, variations } = generator;
  const services = draft.services.split("\n").map((item) => item.trim()).filter(Boolean);
  const benefits = draft.benefits.split("\n").map((item) => item.trim()).filter(Boolean);
  const whatsappUrl = previewSite ? makeLeadWhatsappUrl(draft.phone, previewSite.whatsappMessage) : null;
  const renderData: LandingRenderData = {
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
    whatsappUrl,
  };

  function update<K extends keyof PremiumSiteDraft>(key: K, value: PremiumSiteDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid bg-[#02040a]/80 p-4 backdrop-blur-md xl:grid-cols-[560px_1fr]">
      <section className="premium-panel scroll-stable min-h-0 overflow-y-auto rounded-l-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Gerador premium de site</h2>
            <p className="mt-1 text-sm text-[#95a7bd]">{lead.name} · {lead.city} · {lead.hasWebsite ? "com site" : "sem site"}</p>
          </div>
          <button className="grid size-9 place-items-center rounded-md border border-[#6ee7ff]/20 bg-white/5 text-[#dceeff] transition-colors hover:border-[#6ee7ff]/45 hover:bg-white/10" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="premium-panel-soft mt-4 grid gap-2 rounded-xl p-3 text-sm text-[#dceeff]">
          <div><strong>Nicho:</strong> {lead.niche}</div>
          <div><strong>Endereço:</strong> {lead.address || "Não informado"}</div>
          <div><strong>Telefone:</strong> {lead.phone ?? "Não informado"}</div>
        </div>

        <h3 className="mt-5 text-sm font-semibold text-white">Modelos premium</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {variations.map((variation) => (
            <TemplatePreviewCard
              key={variation.type}
              variation={variation}
              selected={draft.templateType === variation.type}
              onUse={() => onChooseVariation(variation)}
              onPreview={() => onChooseVariation(variation)}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Título"><input className="field" value={draft.title} onChange={(event) => update("title", event.target.value)} /></Field>
          <Field label="Subtítulo"><input className="field" value={draft.subtitle} onChange={(event) => update("subtitle", event.target.value)} /></Field>
          <Field label="Texto sobre"><textarea className="field min-h-28" value={draft.description} onChange={(event) => update("description", event.target.value)} /></Field>
          <Field label="Serviços"><textarea className="field min-h-28" value={draft.services} onChange={(event) => update("services", event.target.value)} /></Field>
          <Field label="Benefícios"><textarea className="field min-h-28" value={draft.benefits} onChange={(event) => update("benefits", event.target.value)} /></Field>
          <Field label="CTA principal"><input className="field" value={draft.ctaText} onChange={(event) => update("ctaText", event.target.value)} /></Field>
          <Field label="CTA final"><input className="field" value={draft.ctaFinal} onChange={(event) => update("ctaFinal", event.target.value)} /></Field>
          <Field label="WhatsApp"><input className="field" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></Field>
          <Field label="Endereço"><input className="field" value={draft.address} onChange={(event) => update("address", event.target.value)} /></Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Variação visual">
              <select className="field" value={draft.visualStyle} onChange={(event) => update("visualStyle", event.target.value as LandingVisualStyle)}>
                <option value="claro">Claro profissional</option>
                <option value="escuro">Escuro premium</option>
                <option value="minimalista">Elegante minimalista</option>
                <option value="gradiente">Gradiente leve</option>
                <option value="cartao">Cartão moderno</option>
              </select>
            </Field>
            <Field label="Estilo do botão">
              <select className="field" value={draft.buttonStyle} onChange={(event) => update("buttonStyle", event.target.value as LandingButtonStyle)}>
                <option value="whatsapp">WhatsApp</option>
                <option value="primary">Primário</option>
                <option value="secondary">Secundário</option>
                <option value="premium">Premium</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cor principal"><input className="field h-11" type="color" value={draft.primaryColor} onChange={(event) => update("primaryColor", event.target.value)} /></Field>
            <Field label="Cor de destaque"><input className="field h-11" type="color" value={draft.accentColor} onChange={(event) => update("accentColor", event.target.value)} /></Field>
          </div>

          <div className="premium-panel-soft grid gap-2 rounded-xl p-3 text-sm text-[#dceeff]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showMap} onChange={(event) => update("showMap", event.target.checked)} /> Mostrar mapa</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showAbout} onChange={(event) => update("showAbout", event.target.checked)} /> Mostrar seção sobre</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.showBenefits} onChange={(event) => update("showBenefits", event.target.checked)} /> Mostrar benefícios</label>
          </div>
        </div>

        <div className="mt-5">
          <QualityScoreCard
            input={{
              title: draft.title,
              ctaText: draft.ctaText,
              phone: draft.phone,
              services,
              benefits,
              address: draft.address,
              hasMap: draft.showMap,
              publicUrl: previewSite?.publicUrl,
            }}
          />
        </div>

        <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#6ee7ff]/30 bg-[#21d4fd] px-4 text-sm font-black text-[#06101d] shadow-[0_6px_0_#087392,0_18px_34px_rgba(33,212,253,0.18)] transition-colors hover:bg-[#6ee7ff] active:translate-y-px disabled:opacity-60" disabled={isSaving} onClick={onSave}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
          Salvar landing
        </button>

        {previewSite ? (
          <div className="mt-3 grid gap-2">
            <button className="lead-action" onClick={() => onCopy(`modal-link-${previewSite.id}`, previewSite.publicUrl)}>
              <Copy className="size-4" />
              {copiedKey === `modal-link-${previewSite.id}` ? "Link copiado" : "Copiar link da página"}
            </button>
            <button className="lead-action" onClick={() => onCopy(`modal-msg-${previewSite.id}`, previewSite.whatsappMessage)}>
              <Copy className="size-4" />
              {copiedKey === `modal-msg-${previewSite.id}` ? "Mensagem copiada" : "Copiar mensagem"}
            </button>
            {whatsappUrl ? (
              <a className="lead-action bg-[#f1faf6] text-[#17624f]" href={whatsappUrl} rel="noreferrer">
                <Send className="size-4" />
                Enviar no WhatsApp
              </a>
            ) : (
              <div className="rounded-md border border-[#e5b7a4] bg-[#fff5f0] px-3 py-2 text-xs text-[#8a2f13]">
                Este lead não possui telefone cadastrado. Copie a mensagem e envie manualmente.
              </div>
            )}
          </div>
        ) : null}

        {history.length ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Histórico deste lead</h3>
            <div className="mt-2 grid gap-2">
              {history.map((site) => (
                <div key={site.id} className="rounded-md border border-[#6ee7ff]/16 bg-white/5 p-3 text-xs text-[#dceeff]">
                  <div className="flex justify-between gap-2"><strong>{site.templateType}</strong><span>{site.status}</span></div>
                  <div className="mt-1 text-[#95a7bd]">{new Date(site.createdAt).toLocaleString("pt-BR")}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button className="mini-action" onClick={() => onCopy(`modal-hist-link-${site.id}`, site.publicUrl)}>Link</button>
                    <button className="mini-action" onClick={() => onCopy(`modal-hist-msg-${site.id}`, site.whatsappMessage)}>Msg</button>
                    <a className="mini-action text-center" href={site.publicUrl} rel="noreferrer">Abrir</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="premium-panel-soft scroll-stable min-h-0 overflow-y-auto rounded-r-2xl p-4">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#6ee7ff]/18 bg-[#07101f] shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
          <LandingHero data={renderData} />
          <TrustSection data={renderData} />
          {draft.showAbout ? (
            <section className="px-5 py-10 md:px-10">
              <div className="mx-auto max-w-6xl rounded-2xl border border-[#d9ddd2] bg-white p-6 shadow-sm">
                <h4 className="text-2xl font-black text-[#171a16]">Sobre {lead.name}</h4>
                <p className="mt-3 leading-7 text-[#50594b]">{draft.description}</p>
              </div>
            </section>
          ) : null}
          <ServicesSection data={renderData} />
          <BenefitsSection data={renderData} />
          <LocationSection data={renderData} />
          <FinalCTA data={renderData} />
          <LandingFooter data={renderData} />
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
      {label}
      {children}
    </label>
  );
}

