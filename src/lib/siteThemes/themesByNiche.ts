import { sitePalettes, type SitePalette, type SitePaletteKey } from "@/lib/siteThemes/palettes";
import { siteFonts, type SiteFontKey } from "@/lib/siteThemes/fonts";
import type { LandingButtonStyle, LandingTemplateType, LandingVisualStyle } from "@/types";

export type SiteThemePreset = {
  templateType: LandingTemplateType;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  paletteKey: SitePaletteKey;
  fontKey: SiteFontKey;
  cardRadius: number;
  shadowIntensity: "soft" | "medium" | "strong";
  tone: "professional" | "premium" | "modern" | "elegant" | "conversion";
};

const nicheThemeMap: Record<string, Partial<SiteThemePreset>> = {
  barbearia: { paletteKey: "premiumDark", fontKey: "montserrat", templateType: "premium", visualStyle: "escuro", buttonStyle: "premium", tone: "premium" },
  padaria: { paletteKey: "localElegant", fontKey: "manrope", templateType: "profissional", visualStyle: "cartao", buttonStyle: "primary", tone: "elegant" },
  restaurante: { paletteKey: "foodWarm", fontKey: "poppins", templateType: "oferta", visualStyle: "gradiente", buttonStyle: "whatsapp", tone: "conversion" },
  pizzaria: { paletteKey: "foodWarm", fontKey: "poppins", templateType: "oferta", visualStyle: "gradiente", buttonStyle: "whatsapp", tone: "conversion" },
  hamburgueria: { paletteKey: "foodWarm", fontKey: "montserrat", templateType: "oferta", visualStyle: "gradiente", buttonStyle: "whatsapp", tone: "conversion" },
  "clínica odontológica": { paletteKey: "healthClean", fontKey: "inter", templateType: "profissional", visualStyle: "claro", buttonStyle: "primary", tone: "professional" },
  "consultório médico": { paletteKey: "healthClean", fontKey: "inter", templateType: "profissional", visualStyle: "claro", buttonStyle: "primary", tone: "professional" },
  estética: { paletteKey: "beautySoft", fontKey: "poppins", templateType: "premium", visualStyle: "minimalista", buttonStyle: "premium", tone: "elegant" },
  "clínica de estética": { paletteKey: "beautySoft", fontKey: "poppins", templateType: "premium", visualStyle: "minimalista", buttonStyle: "premium", tone: "elegant" },
  "salão de beleza": { paletteKey: "beautySoft", fontKey: "poppins", templateType: "premium", visualStyle: "minimalista", buttonStyle: "premium", tone: "elegant" },
  "oficina mecânica": { paletteKey: "autoStrong", fontKey: "montserrat", templateType: "premium", visualStyle: "escuro", buttonStyle: "premium", tone: "modern" },
  "oficina de moto": { paletteKey: "autoStrong", fontKey: "montserrat", templateType: "premium", visualStyle: "escuro", buttonStyle: "premium", tone: "modern" },
  borracharia: { paletteKey: "autoStrong", fontKey: "montserrat", templateType: "oferta", visualStyle: "escuro", buttonStyle: "whatsapp", tone: "conversion" },
  academia: { paletteKey: "autoStrong", fontKey: "montserrat", templateType: "premium", visualStyle: "escuro", buttonStyle: "premium", tone: "modern" },
  igreja: { paletteKey: "institutional", fontKey: "manrope", templateType: "profissional", visualStyle: "claro", buttonStyle: "primary", tone: "professional" },
};

export function getThemePresetByNiche(niche: string): SiteThemePreset {
  const preset = nicheThemeMap[niche.toLowerCase()] ?? {};

  return {
    templateType: preset.templateType ?? "profissional",
    visualStyle: preset.visualStyle ?? "claro",
    buttonStyle: preset.buttonStyle ?? "primary",
    paletteKey: preset.paletteKey ?? "professionalLight",
    fontKey: preset.fontKey ?? "inter",
    cardRadius: preset.cardRadius ?? 12,
    shadowIntensity: preset.shadowIntensity ?? "medium",
    tone: preset.tone ?? "professional",
  };
}

export function getPaletteForNiche(niche: string): SitePalette {
  return sitePalettes[getThemePresetByNiche(niche).paletteKey];
}

export function getFontForNiche(niche: string) {
  return siteFonts[getThemePresetByNiche(niche).fontKey];
}
