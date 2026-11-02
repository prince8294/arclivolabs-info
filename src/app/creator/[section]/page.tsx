import { CreatorPortalPage } from "@/components/portal/creator-portal";

export default async function CreatorSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <CreatorPortalPage section={section} />;
}
