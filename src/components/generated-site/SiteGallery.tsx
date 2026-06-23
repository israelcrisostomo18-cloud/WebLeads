import { ImageIcon } from "lucide-react";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteGallery({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  const items = data.gallery?.length ? data.gallery : ["Ambiente", "Atendimento", "Serviços", "Localização"];

  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.surfaceAlt, color: palette.text }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase" style={{ color: palette.primary }}>Galeria visual</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">Espaços para fotos reais</h2>
          </div>
          <p className="max-w-md text-sm leading-6" style={{ color: palette.muted }}>Enquanto não há fotos do cliente, o modelo usa blocos visuais leves e elegantes.</p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={item}
              className="flex aspect-[4/5] flex-col justify-between rounded-3xl border p-5"
              style={{
                borderColor: palette.border,
                background: `linear-gradient(145deg, ${index % 2 ? palette.primary : palette.secondary}, ${palette.accent})`,
                boxShadow: "inset 0 -120px 90px rgba(0,0,0,0.32)",
                color: "#ffffff",
                textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              }}
            >
              <ImageIcon className="size-7" />
              <div className="text-xl font-black">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
