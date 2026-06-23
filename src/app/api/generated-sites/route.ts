import { NextResponse } from "next/server";
import {
  buildLandingWhatsappMessage,
  buildMetaDescription,
  buildSeoTitle,
  makePublicUrl,
  siteRowToGeneratedSite,
  slugify,
} from "@/lib/sites";
import { getDemoUserId, getSupabaseAdmin } from "@/lib/supabase";
import type {
  BusinessLead,
  GeneratedSiteStatus,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

type SaveSiteBody = {
  business: BusinessLead;
  templateType: LandingTemplateType;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  differentials?: string[];
  gallery?: string[];
  questions?: Array<{ question: string; answer: string }>;
  ctaText: string;
  ctaFinal: string;
  phone: string | null;
  address: string;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  primaryColor: string;
  accentColor: string;
  paletteKey?: string;
  fontKey?: string;
  cardRadius?: number;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
  showFaq?: boolean;
  sectionVisibility?: Record<string, boolean>;
  siteName?: string;
  expiresInDays?: 7 | 15 | 30;
  saleStatus?: GeneratedSiteStatus;
  salePrice?: string;
  finalPublishMode?: string;
  customDomain?: string;
  deliveryChecklist?: Record<string, boolean>;
  deliveryNotes?: string;
  status?: GeneratedSiteStatus;
};

function makeSlugForLead(business: BusinessLead, templateType: LandingTemplateType) {
  const base = slugify(`${business.name}-${business.city}-${templateType}`) || crypto.randomUUID();
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const osmId = searchParams.get("osmId");
  const osmType = searchParams.get("osmType");
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ sites: [] });
  }

  let query = supabase.from("generated_sites").select("*").order("created_at", { ascending: false });

  if (businessId) {
    query = query.eq("business_id", businessId);
  } else if (osmId && osmType) {
    query = query.eq("business_osm_id", osmId).eq("business_osm_type", osmType);
  } else {
    return NextResponse.json({ error: "Informe businessId ou osmId/osmType." }, { status: 400 });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sites: (data ?? []).map(siteRowToGeneratedSite) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as SaveSiteBody;
  const business = body.business;

  if (!business?.osmId || !business?.osmType) {
    return NextResponse.json({ error: "Empresa inválida." }, { status: 400 });
  }

  const slug = makeSlugForLead(business, body.templateType);
  const publicToken = crypto.randomUUID().replace(/-/g, "");
  const publicUrl = makePublicUrl(slug);
  const expiresInDays = Number(body.expiresInDays ?? 7);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.min(Math.max(expiresInDays, 7), 30) * 24 * 60 * 60 * 1000);
  const whatsappMessage = buildLandingWhatsappMessage({ lead: business, publicUrl });
  const seoTitle = buildSeoTitle({
    businessName: business.name,
    niche: business.niche,
    city: business.city,
  });
  const metaDescription = buildMetaDescription({
    businessName: business.name,
    niche: business.niche,
    city: business.city,
  });
  const payload = {
    user_id: getDemoUserId(),
    business_id: business.id ?? null,
    site_name: body.siteName ?? `${business.name} - site modelo`,
    business_osm_id: business.osmId,
    business_osm_type: business.osmType,
    business_name: business.name,
    niche: business.niche,
    city: business.city,
    template_type: body.templateType,
    visual_style: body.visualStyle,
    button_style: body.buttonStyle,
    slug,
    public_token: publicToken,
    seo_title: seoTitle,
    meta_description: metaDescription,
    title: body.title,
    subtitle: body.subtitle,
    description: body.description,
    services: body.services,
    benefits: body.benefits,
    cta_text: body.ctaText,
    cta_final: body.ctaFinal,
    whatsapp_message: whatsappMessage,
    public_url: publicUrl,
    status: body.saleStatus ?? body.status ?? "publicado",
    expires_at: expiresAt.toISOString(),
    is_public: true,
    phone: body.phone,
    address: body.address || business.address,
    latitude: business.latitude,
    longitude: business.longitude,
    osm_url: business.osmUrl,
    primary_color: body.primaryColor,
    accent_color: body.accentColor,
    show_map: body.showMap,
    show_about: body.showAbout,
    show_benefits: body.showBenefits,
    content_json: {
      title: body.title,
      subtitle: body.subtitle,
      about: body.description,
      services: body.services,
      benefits: body.benefits,
      differentials: body.differentials ?? [],
      gallery: body.gallery ?? [],
      questions: body.questions ?? [],
      ctaText: body.ctaText,
      ctaFinal: body.ctaFinal,
      address: body.address || business.address,
      phone: body.phone,
      salePrice: body.salePrice ?? "",
    },
    design_json: {
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      paletteKey: body.paletteKey,
      fontKey: body.fontKey,
      cardRadius: body.cardRadius,
      visualStyle: body.visualStyle,
      buttonStyle: body.buttonStyle,
      cardStyle: "premium",
      layout: "site-builder-v1",
      finalPublishMode: body.finalPublishMode ?? "preview",
      customDomain: body.customDomain ?? "",
    },
    sections_json: {
      order: ["hero", "trust", "services", "benefits", "about", "location", "middle-cta", "faq", "final-cta", "footer"],
      visible: {
        map: body.showMap,
        about: body.showAbout,
        benefits: body.showBenefits,
        faq: body.showFaq ?? true,
        ...(body.sectionVisibility ?? {}),
      },
      deliveryChecklist: body.deliveryChecklist ?? {},
      deliveryNotes: body.deliveryNotes ?? "",
    },
    published_at: now.toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      site: siteRowToGeneratedSite({
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }),
      warning: "Supabase não configurado; preview salvo apenas na resposta.",
    });
  }

  const { data, error } = await supabase
    .from("generated_sites")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ site: siteRowToGeneratedSite(data) });
}
