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
    redirect("/");
  }

  const { data } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!data) {
    redirect("/");
  }

  redirect(`/lp/${siteRowToGeneratedSite(data).slug}`);
}
