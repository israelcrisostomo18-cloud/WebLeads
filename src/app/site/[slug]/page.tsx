import type { Metadata } from "next";
import { GeneratedSiteRenderer } from "@/components/generated-site/GeneratedSiteRenderer";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import { makeLeadWhatsappUrl, siteRowToGeneratedSite } from "@/lib/sites";
import { getWhatsAppUrl } from "@/lib/messages/whatsappMessages";
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

async function markViewed(siteId: string, status: string) {
  if (!["rascunho", "enviado", "publicado"].includes(status)) {
    return;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase
    .from("generated_sites")
    .update({ status: "visualizado", updated_at: new Date().toISOString() })
    .eq("id", siteId);
}

function isExpired(site: NonNullable<Awaited<ReturnType<typeof getSite>>>) {
  return site.status === "expirado" || Boolean(site.expiresAt && new Date(site.expiresAt).getTime() < Date.now());
}

function sellerWhatsappUrl(message: string) {
  const phone = process.env.NEXT_PUBLIC_SELLER_WHATSAPP;

  if (!phone) {
    return null;
  }

  return getWhatsAppUrl(phone, message);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);

  if (!site) {
    return { title: "Site não encontrado" };
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

export default async function PublicSitePage({ params }: PageProps) {
  const { slug } = await params;
  const site = await getSite(slug);

  if (!site || isExpired(site) || site.isPublic === false) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070a12] p-6 text-center text-white">
        <div className="max-w-lg rounded-2xl border border-[#6ee7ff]/20 bg-white/5 p-8 shadow-2xl">
          <h1 className="text-2xl font-black">Este modelo de site expirou.</h1>
          <p className="mt-3 text-[#95a7bd]">Peça para reativar ou publicar uma nova versão temporária.</p>
        </div>
      </main>
    );
  }

  await markViewed(site.id, site.status);

  const whatsappUrl = makeLeadWhatsappUrl(site.phone, site.whatsappMessage);
  const acceptMessage = "Olá, gostei do modelo do site e quero ativar para minha empresa.";
  const creatorUrl = sellerWhatsappUrl(`Olá, quero falar sobre o site modelo: ${site.publicUrl}`);
  const acceptUrl = sellerWhatsappUrl(acceptMessage);
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

  return (
    <main className="min-h-screen">
      <GeneratedSiteRenderer data={renderData} />
      <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-[#6ee7ff]/20 bg-[#070a12]/92 p-3 shadow-2xl backdrop-blur md:flex-row">
        {acceptUrl ? (
          <a className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#21d4fd] px-4 text-sm font-black text-[#06101d]" href={acceptUrl} rel="noreferrer">
            Quero esse site
          </a>
        ) : (
          <span className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-bold text-white">
            Quero esse site
          </span>
        )}
        {creatorUrl ? (
          <a className="flex h-12 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white" href={creatorUrl} rel="noreferrer">
            Falar com o criador do site
          </a>
        ) : (
          <span className="flex h-12 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white">
            Falar com o criador do site
          </span>
        )}
      </div>
    </main>
  );
}
