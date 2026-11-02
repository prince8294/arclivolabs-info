import { BrandPortalPage } from "@/components/portal/brand-portal";

export default async function BrandSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <BrandPortalPage section={section} />;
}
