import { ShieldCheck } from "lucide-react";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteBenefits({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  if (!data.showBenefits) return null;

  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.surfaceAlt, color: palette.text }}>
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-black uppercase" style={{ color: palette.primary }}>Benefícios</p>
          <h2 className="mt-2 text-3xl font-black md:text-4xl">Mais confiança antes do contato</h2>
          <p className="mt-4 leading-7" style={{ color: palette.muted }}>A página organiza as informações que ajudam o cliente a decidir e reduz o caminho até a conversa.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.benefits.map((benefit) => (
            <div key={benefit} className="flex min-h-24 gap-3 rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
              <ShieldCheck className="mt-1 size-5 shrink-0" style={{ color: palette.primary }} />
              <span className="text-sm font-bold leading-6">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
