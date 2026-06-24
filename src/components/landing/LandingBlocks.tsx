import { MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button3D } from "@/components/landing/Button3D";
import type { LandingButtonStyle, LandingVisualStyle } from "@/types";

export type LandingRenderData = {
  businessName: string;
  niche: string;
  city: string;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  ctaText: string;
  ctaFinal: string;
  phone: string | null;
  address: string;
  latitude: number;
  longitude: number;
  osmUrl: string;
  primaryColor: string;
  accentColor: string;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
  whatsappUrl: string | null;
};

function normalizeLandingRenderData(data: LandingRenderData): LandingRenderData {
  const primaryColor = /^#[0-9a-f]{6}$/i.test(data.primaryColor ?? "") ? data.primaryColor : "#10243f";
  const accentColor = /^#[0-9a-f]{6}$/i.test(data.accentColor ?? "") ? data.accentColor : "#21d4fd";

  return {
    ...data,
    businessName: data.businessName || "Empresa local",
    niche: data.niche || "negócio local",
    city: data.city || "sua cidade",
    title: data.title || `${data.businessName || "Empresa local"} no digital`,
    subtitle: data.subtitle || "Uma página profissional para apresentar serviços e facilitar o contato pelo WhatsApp.",
    description: data.description || "Atendimento local com informações claras, contato direto e presença online profissional.",
    services: Array.isArray(data.services) && data.services.length ? data.services : ["Atendimento local", "Orçamento pelo WhatsApp", "Serviços personalizados"],
    benefits: Array.isArray(data.benefits) && data.benefits.length ? data.benefits : ["Contato rápido", "Informações claras", "Experiência simples no celular"],
    ctaText: data.ctaText || "Chamar no WhatsApp",
    ctaFinal: data.ctaFinal || "Fale agora e solicite atendimento.",
    address: data.address || "Endereço a confirmar",
    latitude: Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : 0,
    longitude: Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : 0,
    primaryColor,
    accentColor,
    visualStyle: data.visualStyle || "claro",
    buttonStyle: data.buttonStyle || "whatsapp",
    showMap: data.showMap ?? true,
    showAbout: data.showAbout ?? true,
    showBenefits: data.showBenefits ?? true,
    whatsappUrl: data.whatsappUrl ?? null,
  };
}

function shellClass(style: LandingVisualStyle) {
  if (style === "escuro") return "bg-[#0f172a] text-white";
  if (style === "minimalista") return "bg-white text-[#171a16]";
  if (style === "gradiente") return "bg-[#fffaf1] text-[#24170c]";
  if (style === "cartao") return "bg-[#f3f6ef] text-[#20241f]";
  return "bg-[#fbfcf8] text-[#20241f]";
}

export function LandingHero({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);
  const isDark = data.visualStyle === "escuro";

  return (
    <section className={`${shellClass(data.visualStyle)} relative overflow-hidden px-5 py-16 md:px-10 md:py-20`}>
      <div
        className="absolute inset-x-0 top-0 h-1/2 opacity-20"
        style={{ background: `radial-gradient(circle at 20% 10%, ${data.accentColor}, transparent 35%), linear-gradient(135deg, ${data.primaryColor}, transparent)` }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: data.accentColor, color: "#1d1a12" }}>
            {data.niche} em {data.city}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{data.title}</h1>
          <p className={`mt-5 max-w-2xl text-lg leading-8 ${isDark ? "text-white/78" : "text-[#50594b]"}`}>{data.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {data.whatsappUrl ? (
              <Button3D href={data.whatsappUrl} variant={data.buttonStyle}>
                <MessageCircle className="size-4" />
                {data.ctaText}
              </Button3D>
            ) : null}
            <Button3D href="#localizacao" variant="secondary">
              <MapPin className="size-4" />
              Ver localização
            </Button3D>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/10 bg-white/8" : "border-[#d9ddd2] bg-white"}`}>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl" style={{ backgroundColor: data.accentColor }}>
              <Sparkles className="size-5 text-[#1d1a12]" />
            </div>
            <div>
              <div className="font-bold">{data.businessName}</div>
              <div className={isDark ? "text-sm text-white/65" : "text-sm text-[#66705f]"}>{data.address || "Atendimento local"}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {data.benefits.slice(0, 3).map((benefit) => (
              <div key={benefit} className={`rounded-xl p-3 text-sm ${isDark ? "bg-white/10" : "bg-[#f8faf6]"}`}>{benefit}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustSection({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);

  return (
    <section className="px-5 py-8 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
        {["Atendimento direto", "Informações claras", "Experiência rápida no celular"].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-xl border border-[#d9ddd2] bg-white p-4 shadow-sm">
            <ShieldCheck className="size-5" style={{ color: data.primaryColor }} />
            <span className="text-sm font-bold">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServicesSection({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);

  return (
    <section className="px-5 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-black md:text-3xl">Serviços em destaque</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((service) => (
            <div key={service} className="rounded-xl border border-[#d9ddd2] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 h-1.5 w-12 rounded-full" style={{ backgroundColor: data.accentColor }} />
              <h3 className="font-bold">{service}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BenefitsSection({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);

  if (!data.showBenefits) return null;

  return (
    <section className="px-5 py-10 md:px-10">
      <div className="mx-auto max-w-6xl rounded-2xl p-6 md:p-8" style={{ backgroundColor: `${data.accentColor}33` }}>
        <h2 className="text-2xl font-black md:text-3xl">Por que escolher</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data.benefits.map((benefit) => (
            <div key={benefit} className="rounded-xl bg-white/85 p-4 text-sm font-semibold shadow-sm">{benefit}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LocationSection({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);

  if (!data.showMap) return null;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.006}%2C${data.latitude - 0.006}%2C${data.longitude + 0.006}%2C${data.latitude + 0.006}&layer=mapnik&marker=${data.latitude}%2C${data.longitude}`;

  return (
    <section className="px-5 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-[#d9ddd2] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Localização</h2>
          <p className="mt-3 leading-7 text-[#50594b]">{data.address || "Endereço a confirmar"}</p>
          <Button3D href="#localizacao" variant="secondary" className="mt-5 w-full">
            <MapPin className="size-4" />
            Ver mapa nesta página
          </Button3D>
        </div>
        <details className="rounded-2xl border border-[#d9ddd2] bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-bold text-[#1f7a62]">Ver localização no mapa</summary>
          <iframe className="mt-4 h-72 w-full rounded-xl border border-[#d9ddd2]" src={mapUrl} title={`Mapa de ${data.businessName}`} loading="lazy" />
        </details>
      </div>
    </section>
  );
}

export function FinalCTA({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);

  return (
    <section className="px-5 py-12 text-center md:px-10" style={{ backgroundColor: data.accentColor }}>
      <h2 className="mx-auto max-w-3xl text-3xl font-black text-[#1d1a12]">{data.ctaFinal}</h2>
      {data.whatsappUrl ? (
        <Button3D href={data.whatsappUrl} variant="premium" className="mt-6">
          <MessageCircle className="size-4" />
          {data.ctaText}
        </Button3D>
      ) : null}
    </section>
  );
}

export function LandingFooter({ data }: { data: LandingRenderData }) {
  data = normalizeLandingRenderData(data);

  return (
    <footer className="bg-[#111827] px-5 py-6 text-center text-sm text-white/70">
      <strong className="text-white">{data.businessName}</strong> · {data.niche} em {data.city}
    </footer>
  );
}
