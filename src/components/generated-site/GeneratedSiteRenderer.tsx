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
  const niche = data.niche || "negócio local";
  const preset = getThemePresetByNiche(niche);
  const palette = sitePalettes[data.paletteKey ?? preset.paletteKey] ?? sitePalettes[preset.paletteKey];
  const normalized: GeneratedSiteRenderData = {
    ...data,
    businessName: data.businessName || "Empresa local",
    niche,
    city: data.city || "sua cidade",
    title: data.title || `${data.businessName || "Empresa local"} no digital`,
    subtitle: data.subtitle || "Uma página profissional para apresentar serviços e facilitar o contato pelo WhatsApp.",
    description: data.description || "Atendimento local com informações claras, contato direto e presença online profissional.",
    services: data.services?.length ? data.services : getGeneratedServicesByNiche(niche),
    benefits: data.benefits?.length ? data.benefits : getGeneratedBenefitsByNiche(niche),
    differentials: data.differentials?.length ? data.differentials : getGeneratedDifferentials(niche),
    faqs: data.faqs?.length ? data.faqs : getGeneratedFAQByNiche(niche),
    gallery: data.gallery ?? [],
    ctaText: data.ctaText || "Chamar no WhatsApp",
    ctaFinal: data.ctaFinal || "Fale agora e solicite atendimento.",
    primaryColor: data.primaryColor || palette.primary,
    accentColor: data.accentColor || palette.accent,
    showMap: data.showMap ?? true,
    showAbout: data.showAbout ?? true,
    showBenefits: data.showBenefits ?? true,
    showFaq: data.showFaq ?? true,
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
