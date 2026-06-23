import type { GeneratedButtonStyle } from "@/lib/siteThemes/buttonStyles";
import type { SiteFontKey } from "@/lib/siteThemes/fonts";
import type { SitePaletteKey } from "@/lib/siteThemes/palettes";
import type { LandingButtonStyle, LandingVisualStyle } from "@/types";

export type GeneratedSiteFAQ = {
  question: string;
  answer: string;
};

export type GeneratedSiteRenderData = {
  businessName: string;
  niche: string;
  city: string;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  differentials?: string[];
  faqs?: GeneratedSiteFAQ[];
  gallery?: string[];
  ctaText: string;
  ctaFinal: string;
  phone: string | null;
  address: string;
  latitude: number;
  longitude: number;
  osmUrl: string;
  primaryColor: string;
  accentColor: string;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle | GeneratedButtonStyle;
  paletteKey?: SitePaletteKey;
  fontKey?: SiteFontKey;
  cardRadius?: number;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
  showFaq?: boolean;
  whatsappUrl: string | null;
};
