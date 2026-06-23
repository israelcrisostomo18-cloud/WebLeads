import { Award } from "lucide-react";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import { getGeneratedDifferentials } from "@/lib/siteGenerator/copyByNiche";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteDifferentials({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  const items = data.differentials?.length ? data.differentials : getGeneratedDifferentials(data.niche);

  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.background, color: palette.text }}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black md:text-4xl">Diferenciais</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
              <Award className="size-6" style={{ color: palette.accent }} />
              <h3 className="mt-4 font-black">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
