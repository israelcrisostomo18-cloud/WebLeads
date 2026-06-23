import { SiteBuilderApp } from "@/components/site-builder/SiteBuilderApp";

type PageProps = {
  params: Promise<{
    businessId: string;
  }>;
};

export default async function SiteBuilderPage({ params }: PageProps) {
  const { businessId } = await params;
  return <SiteBuilderApp businessId={businessId} />;
}
