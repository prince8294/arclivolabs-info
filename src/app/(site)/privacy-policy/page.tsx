import type { Metadata } from "next";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "Placeholder privacy policy page." };

export default function PrivacyPage() {
  return <><PageIntro eyebrow="LEGAL" title={<>Privacy<br /><em>Policy.</em></>} description="This page is a starter placeholder and must be reviewed and completed before public launch." /><section className="legal-copy section-pad"><p><strong>Last updated: November 2026 · Placeholder</strong></p><p>This website is a development demo. No form submissions are transmitted to or stored by a backend at this stage. Replace this notice with a policy reviewed for your business, jurisdiction, analytics, cookies, data processors, and retention practices before launch.</p><h2>Information we may collect</h2><p>When backend services are added, describe the information collected, how it is used, and the legal basis for processing. Do not use this sample copy as legal advice.</p><h2>Contact</h2><p>For privacy questions, provide a verified business contact address before publishing.</p></section></>;
}
