import type { Metadata } from "next";
import { PageIntro } from "@/components/site";
import { StudyGrid } from "./study-grid";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = { title: "Case Studies", description: "Explore illustrative creator campaign concepts. No real client results are represented." };

export default function CaseStudiesPage() {
  return <><PageIntro eyebrow="A FEW IDEAS IN MOTION" title={<>Campaigns with<br /><em>something to say.</em></>} description="A portfolio layout showing how a campaign story can come together. All examples are fictional concepts, not verified client work." /><section className="section-pad portfolio-section"><StudyGrid /></section><CtaBand title={<>Your next story<br /><em>starts here.</em></>} description="Have a campaign challenge you’d like to work through? Let’s make a thoughtful plan." /></>;
}
