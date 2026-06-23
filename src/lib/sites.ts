import { getSiteReadyMessage, getWhatsAppUrl } from "@/lib/messages/whatsappMessages";
import type {
  BusinessLead,
  GeneratedSite,
  GeneratedSiteStatus,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function makePublicUrl(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/site/${slug}`;
}

export function buildSeoTitle(args: {
  businessName: string;
  niche: string;
  city: string;
}) {
  return `${args.businessName} | ${args.niche} em ${args.city}`;
}

export function buildMetaDescription(args: {
  businessName: string;
  niche: string;
  city: string;
}) {
  return `Conheça ${args.businessName} em ${args.city}. ${args.niche} com atendimento rápido pelo WhatsApp, serviços profissionais e localização fácil.`;
}

export function buildLandingWhatsappMessage(args: {
  lead: Pick<BusinessLead, "hasWebsite">;
  publicUrl: string;
}) {
  return getSiteReadyMessage(args.publicUrl);
}

export function makeLeadWhatsappUrl(phone: string | null | undefined, message: string) {
  return getWhatsAppUrl(phone, message);
}

export function siteRowToGeneratedSite(row: Record<string, unknown>): GeneratedSite {
  const contentJson = (row.content_json as Record<string, unknown> | null) ?? {};
  const designJson = (row.design_json as Record<string, unknown> | null) ?? {};
  const sectionsJson = (row.sections_json as Record<string, unknown> | null) ?? {};
  const visible = (sectionsJson.visible as Record<string, unknown> | null) ?? {};

  return {
    id: row.id as string,
    businessId: (row.business_id as string | null) ?? null,
    businessOsmId: row.business_osm_id as string,
    businessOsmType: row.business_osm_type as string,
    businessName: row.business_name as string,
    siteName: (row.site_name as string | null) ?? undefined,
    niche: row.niche as string,
    city: (row.city as string | null) ?? "",
    templateType: row.template_type as LandingTemplateType,
    visualStyle: ((row.visual_style as LandingVisualStyle | null) ?? "claro"),
    buttonStyle: ((row.button_style as LandingButtonStyle | null) ?? "primary"),
    slug: row.slug as string,
    seoTitle: (row.seo_title as string | null) ?? buildSeoTitle({
      businessName: row.business_name as string,
      niche: row.niche as string,
      city: (row.city as string | null) ?? "",
    }),
    metaDescription: (row.meta_description as string | null) ?? buildMetaDescription({
      businessName: row.business_name as string,
      niche: row.niche as string,
      city: (row.city as string | null) ?? "",
    }),
    title: row.title as string,
    subtitle: row.subtitle as string,
    description: row.description as string,
    services: (row.services as string[] | null) ?? (contentJson.services as string[] | null) ?? [],
    benefits: (row.benefits as string[] | null) ?? (contentJson.benefits as string[] | null) ?? [],
    differentials: (contentJson.differentials as string[] | null) ?? undefined,
    faqs: (contentJson.questions as Array<{ question: string; answer: string }> | null) ?? undefined,
    gallery: (contentJson.gallery as string[] | null) ?? undefined,
    ctaText: row.cta_text as string,
    ctaFinal: (row.cta_final as string | null) ?? "",
    whatsappMessage: (row.whatsapp_message as string | null) ?? getSiteReadyMessage(row.public_url as string),
    publicUrl: row.public_url as string,
    publicToken: (row.public_token as string | null) ?? null,
    status: row.status as GeneratedSiteStatus,
    expiresAt: (row.expires_at as string | null) ?? null,
    isPublic: (row.is_public as boolean | null) ?? true,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? "",
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    osmUrl: row.osm_url as string,
    primaryColor: (row.primary_color as string | null) ?? "#173b34",
    accentColor: (row.accent_color as string | null) ?? "#f4b860",
    paletteKey: (designJson.paletteKey as string | null) ?? undefined,
    fontKey: (designJson.fontKey as string | null) ?? undefined,
    cardRadius: Number(designJson.cardRadius ?? 12),
    showMap: (row.show_map as boolean | null) ?? true,
    showAbout: (row.show_about as boolean | null) ?? true,
    showBenefits: (row.show_benefits as boolean | null) ?? true,
    showFaq: (visible.faq as boolean | null) ?? true,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
