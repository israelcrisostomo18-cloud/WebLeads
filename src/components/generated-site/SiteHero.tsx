import { MapPin, MessageCircle, Sparkles } from "lucide-react";
import { SiteButton } from "@/components/generated-site/SiteButton";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteHero({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  return (
    <section className="relative overflow-hidden px-5 py-16 md:px-10 md:py-20" style={{ backgroundColor: palette.background, color: palette.text }}>
      <div
        className="absolute inset-x-0 top-0 h-full opacity-20"
        style={{
          background: `linear-gradient(135deg, ${palette.primary}, transparent 46%), radial-gradient(circle at 82% 18%, ${palette.accent}, transparent 32%)`,
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-normal" style={{ backgroundColor: palette.surfaceAlt, color: palette.primary }}>
            {data.niche} em {data.city || "sua região"}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] md:text-6xl">{data.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8" style={{ color: palette.muted }}>{data.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {data.whatsappUrl ? (
              <SiteButton href={data.whatsappUrl} style="whatsapp">
                <MessageCircle className="size-4" />
                {data.ctaText}
              </SiteButton>
            ) : null}
            <SiteButton href="#localizacao" style={palette.isDark ? "secondary" : "light"}>
              <MapPin className="size-4" />
              Ver localização
            </SiteButton>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border p-5 shadow-2xl" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
            <div className="flex items-start gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: palette.accent, color: palette.isDark ? "#10131a" : palette.text }}>
                <Sparkles className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">{data.businessName}</h2>
                <p className="mt-1 text-sm leading-6" style={{ color: palette.muted }}>{data.address || "Atendimento local com contato direto."}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(data.benefits.length ? data.benefits : ["Atendimento direto", "Informações claras"]).slice(0, 4).map((benefit) => (
                <div key={benefit} className="rounded-xl p-4 text-sm font-bold" style={{ backgroundColor: palette.surfaceAlt }}>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {["Contato", "Serviços", "Mapa"].map((item) => (
              <div key={item} className="rounded-xl border p-4 text-sm font-black" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
