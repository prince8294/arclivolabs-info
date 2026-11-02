import { CreatorPortalPage } from "@/components/portal/creator-portal";

export default async function CreatorRecordPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <CreatorPortalPage section={section} recordId={id} />;
}
