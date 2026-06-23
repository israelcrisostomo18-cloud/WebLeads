import { CheckCircle2 } from "lucide-react";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteServices({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.background, color: palette.text }}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase" style={{ color: palette.primary }}>Serviços</p>
          <h2 className="mt-2 text-3xl font-black md:text-4xl">O que o cliente encontra aqui</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((service) => (
            <article key={service} className="min-h-36 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
              <CheckCircle2 className="size-6" style={{ color: palette.primary }} />
              <h3 className="mt-4 text-lg font-black">{service}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: palette.muted }}>Informação clara para o visitante entender rapidamente e chamar no WhatsApp.</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
