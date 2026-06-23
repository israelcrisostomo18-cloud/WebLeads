import { SiteAbout } from "@/components/generated-site/SiteAbout";
import { SiteBenefits } from "@/components/generated-site/SiteBenefits";
import { SiteDifferentials } from "@/components/generated-site/SiteDifferentials";
import { SiteFAQ } from "@/components/generated-site/SiteFAQ";
import { SiteFinalCTA } from "@/components/generated-site/SiteFinalCTA";
import { SiteFooter } from "@/components/generated-site/SiteFooter";
import { SiteGallery } from "@/components/generated-site/SiteGallery";
import { SiteHero } from "@/components/generated-site/SiteHero";
import { SiteLocation } from "@/components/generated-site/SiteLocation";
import { SiteServices } from "@/components/generated-site/SiteServices";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import { getGeneratedBenefitsByNiche } from "@/lib/siteGenerator/benefitsByNiche";
import { getGeneratedDifferentials } from "@/lib/siteGenerator/copyByNiche";
import { getGeneratedFAQByNiche } from "@/lib/siteGenerator/faqByNiche";
import { getGeneratedServicesByNiche } from "@/lib/siteGenerator/servicesByNiche";
import { getThemePresetByNiche } from "@/lib/siteThemes/themesByNiche";
import { sitePalettes } from "@/lib/siteThemes/palettes";

export function GeneratedSiteRenderer({ data }: { data: GeneratedSiteRenderData }) {
  const preset = getThemePresetByNiche(data.niche);
  const palette = sitePalettes[data.paletteKey ?? preset.paletteKey];
  const normalized: GeneratedSiteRenderData = {
    ...data,
    services: data.services.length ? data.services : getGeneratedServicesByNiche(data.niche),
    benefits: data.benefits.length ? data.benefits : getGeneratedBenefitsByNiche(data.niche),
    differentials: data.differentials?.length ? data.differentials : getGeneratedDifferentials(data.niche),
    faqs: data.faqs?.length ? data.faqs : getGeneratedFAQByNiche(data.niche),
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: palette.background, color: palette.text }}>
      <SiteHero data={normalized} palette={palette} />
      <div id="servicos">
        <SiteServices data={normalized} palette={palette} />
      </div>
      <SiteBenefits data={normalized} palette={palette} />
      <SiteAbout data={normalized} palette={palette} />
      <SiteDifferentials data={normalized} palette={palette} />
      <SiteGallery data={normalized} palette={palette} />
      <div id="localizacao">
        <SiteLocation data={normalized} palette={palette} />
      </div>
      <SiteFAQ data={normalized} palette={palette} />
      <SiteFinalCTA data={normalized} palette={palette} />
      <SiteFooter data={normalized} palette={palette} />
    </main>
  );
}
