import type { Metadata } from "next";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Placeholder terms and conditions page." };

export default function TermsPage() {
  return <><PageIntro eyebrow="LEGAL" title={<>Terms &<br /><em>Conditions.</em></>} description="This page is a starter placeholder and must be reviewed and completed before public launch." /><section className="legal-copy section-pad"><p><strong>Last updated: November 2026 · Placeholder</strong></p><p>This website is a development demo. All agency descriptions, creator profiles, testimonials, brand names, and campaign examples are placeholders unless expressly confirmed otherwise.</p><h2>Website use</h2><p>Replace this sample language with terms appropriate to your business, including jurisdiction, acceptable use, intellectual property, disclaimers, and limitation of liability, after legal review.</p><h2>Contact</h2><p>Add verified business contact details before publishing this page.</p></section></>;
}
