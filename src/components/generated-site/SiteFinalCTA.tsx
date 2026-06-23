import { MessageCircle } from "lucide-react";
import { SiteButton } from "@/components/generated-site/SiteButton";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import { getReadableTextColor, type SitePalette } from "@/lib/siteThemes/palettes";

export function SiteFinalCTA({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  const textColor = getReadableTextColor(palette.primary);

  return (
    <section className="px-5 py-16 text-center md:px-10" style={{ backgroundColor: palette.primary, color: textColor }}>
      <p className="text-sm font-black uppercase opacity-90">{data.businessName}</p>
      <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black md:text-5xl">{data.ctaFinal}</h2>
      {data.whatsappUrl ? (
        <SiteButton href={data.whatsappUrl} style="whatsapp" className="mt-7">
          <MessageCircle className="size-4" />
          {data.ctaText}
        </SiteButton>
      ) : null}
    </section>
  );
}
