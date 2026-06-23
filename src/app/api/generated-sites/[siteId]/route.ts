import { NextResponse } from "next/server";
import { buildLandingWhatsappMessage, makePublicUrl, siteRowToGeneratedSite } from "@/lib/sites";
import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  GeneratedSiteStatus,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
} from "@/types";

type UpdateBody = {
  templateType?: LandingTemplateType;
  visualStyle?: LandingVisualStyle;
  buttonStyle?: LandingButtonStyle;
  title?: string;
  subtitle?: string;
  description?: string;
  services?: string[];
  benefits?: string[];
  ctaText?: string;
  ctaFinal?: string;
  phone?: string | null;
  address?: string;
  primaryColor?: string;
  accentColor?: string;
  showMap?: boolean;
  showAbout?: boolean;
  showBenefits?: boolean;
  status?: GeneratedSiteStatus;
};

type Params = {
  params: Promise<{
    siteId: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { siteId } = await params;
  const body = (await request.json()) as UpdateBody;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  const { data: current, error: currentError } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: currentError?.message ?? "Página não encontrada." }, { status: 404 });
  }

  const publicUrl = current.public_url ?? makePublicUrl(current.slug);
  const whatsappMessage = buildLandingWhatsappMessage({
    lead: { hasWebsite: false },
    publicUrl,
  });

  const patch = {
    template_type: body.templateType,
    visual_style: body.visualStyle,
    button_style: body.buttonStyle,
    title: body.title,
    subtitle: body.subtitle,
    description: body.description,
    services: body.services,
    benefits: body.benefits,
    cta_text: body.ctaText,
    cta_final: body.ctaFinal,
    phone: body.phone,
    address: body.address,
    primary_color: body.primaryColor,
    accent_color: body.accentColor,
    show_map: body.showMap,
    show_about: body.showAbout,
    show_benefits: body.showBenefits,
    status: body.status,
    whatsapp_message: whatsappMessage,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("generated_sites")
    .update(Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)))
    .eq("id", siteId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ site: siteRowToGeneratedSite(data) });
}
