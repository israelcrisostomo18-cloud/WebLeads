import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteAbout({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  if (!data.showAbout) return null;

  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.background, color: palette.text }}>
      <div className="mx-auto grid max-w-7xl gap-6 rounded-3xl border p-6 md:grid-cols-[0.85fr_1.15fr] md:p-8" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
        <div>
          <p className="text-sm font-black uppercase" style={{ color: palette.primary }}>Sobre</p>
          <h2 className="mt-2 text-3xl font-black">Sobre {data.businessName}</h2>
        </div>
        <p className="text-base leading-8" style={{ color: palette.muted }}>{data.description}</p>
      </div>
    </section>
  );
}
