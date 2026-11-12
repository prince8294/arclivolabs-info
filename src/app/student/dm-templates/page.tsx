import type { Metadata } from "next";
import { DmTemplates } from "@/components/student/dm-templates";

export const metadata: Metadata = {
  title: "DM Templates — Student Portal | Arclivo",
  description: "20+ ready-to-use Instagram outreach message templates for student ambassadors.",
};

export default function StudentDmTemplatesPage() {
  return <DmTemplates />;
}

