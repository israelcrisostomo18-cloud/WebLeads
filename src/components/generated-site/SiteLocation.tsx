import { MapPin } from "lucide-react";
import { SiteButton } from "@/components/generated-site/SiteButton";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteLocation({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  if (!data.showMap) return null;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.006}%2C${data.latitude - 0.006}%2C${data.longitude + 0.006}%2C${data.latitude + 0.006}&layer=mapnik&marker=${data.latitude}%2C${data.longitude}`;

  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.background, color: palette.text }}>
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[380px_1fr]">
        <div className="rounded-3xl border p-6" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <p className="text-sm font-black uppercase" style={{ color: palette.primary }}>Localização</p>
          <h2 className="mt-2 text-3xl font-black">Como chegar</h2>
          <p className="mt-4 leading-7" style={{ color: palette.muted }}>{data.address || "Endereço a confirmar."}</p>
          <SiteButton href="#localizacao" style={palette.isDark ? "secondary" : "light"} className="mt-6 w-full">
            <MapPin className="size-4" />
            Ver mapa nesta página
          </SiteButton>
        </div>
        <details className="rounded-3xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
          <summary className="cursor-pointer text-sm font-black" style={{ color: palette.primary }}>Abrir mapa OpenStreetMap</summary>
          <iframe className="mt-4 h-80 w-full rounded-2xl border" style={{ borderColor: palette.border }} src={mapUrl} title={`Mapa de ${data.businessName}`} loading="lazy" />
        </details>
      </div>
    </section>
  );
}
