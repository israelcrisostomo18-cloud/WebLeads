import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteFooter({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  return (
    <footer className="px-5 py-8 text-sm md:px-10" style={{ backgroundColor: palette.isDark ? "#05070d" : "#111827", color: "rgba(255,255,255,0.74)" }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <strong className="text-white">{data.businessName}</strong>
          <div>{data.niche} em {data.city || "sua região"}</div>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#servicos">Serviços</a>
          <a href="#localizacao">Localização</a>
          {data.phone ? <span>{data.phone}</span> : null}
        </div>
      </div>
    </footer>
  );
}
