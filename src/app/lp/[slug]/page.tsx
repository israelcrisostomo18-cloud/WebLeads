import type { Metadata } from "next";
import { GeneratedSiteRenderer } from "@/components/generated-site/GeneratedSiteRenderer";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import { makeLeadWhatsappUrl, siteRowToGeneratedSite } from "@/lib/sites";
import { getSupabaseAdmin } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getSite(slug: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("slug", slug)
    .single();

  return data ? siteRowToGeneratedSite(data) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);

  if (!site) {
    return {
      title: "site não encontrada",
    };
  }

  return {
    title: site.seoTitle,
    description: site.metaDescription,
    openGraph: {
      title: site.seoTitle,
      description: site.metaDescription,
      type: "website",
      url: site.publicUrl,
    },
  };
}

export default async function PublicLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const site = await getSite(slug);

  if (!site) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfcf8] p-6 text-center">
        <div>
          <h1 className="text-2xl font-black">site não encontrada</h1>
          <p className="mt-2 text-[#66705f]">Verifique o link ou gere uma nova página para este lead.</p>
        </div>
      </main>
    );
  }

  const whatsappUrl = makeLeadWhatsappUrl(site.phone, site.whatsappMessage);
  const renderData: GeneratedSiteRenderData = {
    businessName: site.businessName,
    niche: site.niche,
    city: site.city,
    title: site.title,
    subtitle: site.subtitle,
    description: site.description,
    services: site.services,
    benefits: site.benefits,
    differentials: site.differentials,
    faqs: site.faqs,
    gallery: site.gallery,
    ctaText: site.ctaText,
    ctaFinal: site.ctaFinal,
    phone: site.phone,
    address: site.address,
    latitude: site.latitude,
    longitude: site.longitude,
    osmUrl: site.osmUrl,
    primaryColor: site.primaryColor,
    accentColor: site.accentColor,
    visualStyle: site.visualStyle,
    buttonStyle: site.buttonStyle,
    paletteKey: site.paletteKey as GeneratedSiteRenderData["paletteKey"],
    fontKey: site.fontKey as GeneratedSiteRenderData["fontKey"],
    cardRadius: site.cardRadius,
    showMap: site.showMap,
    showAbout: site.showAbout,
    showBenefits: site.showBenefits,
    showFaq: site.showFaq,
    whatsappUrl,
  };

  return <GeneratedSiteRenderer data={renderData} />;
}

