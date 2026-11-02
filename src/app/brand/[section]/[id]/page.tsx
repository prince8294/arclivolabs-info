import { BrandPortalPage } from "@/components/portal/brand-portal";

export default async function BrandRecordPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <BrandPortalPage section={section} recordId={id} />;
}
