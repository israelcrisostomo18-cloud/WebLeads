import { redirect } from "next/navigation";
import { siteRowToGeneratedSite } from "@/lib/sites";
import { getSupabaseAdmin } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    siteId: string;
  }>;
};

export default async function LegacyLandingPage({ params }: PageProps) {
  const { siteId } = await params;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return <LandingNotFound />;
  }

  const { data } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!data) {
    return <LandingNotFound />;
  }

  const site = siteRowToGeneratedSite(data);

  redirect(`/lp/${site.slug}`);
}

function LandingNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#070a12] p-6 text-center text-white">
      <div className="max-w-lg rounded-2xl border border-[#6ee7ff]/20 bg-white/5 p-8 shadow-2xl">
        <h1 className="text-2xl font-black">Landing page não encontrada.</h1>
        <p className="mt-3 text-[#95a7bd]">Volte ao WebLeads e gere um novo site para este lead.</p>
      </div>
    </main>
  );
}
