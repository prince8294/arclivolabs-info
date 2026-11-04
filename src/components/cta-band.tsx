import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function CtaBand({ title, description }: { title: React.ReactNode; description: string }) {
  return <section className="cta-band section-pad"><div className="cta-copy"><span className="eyebrow">LET’S MAKE SOMETHING MATTER</span><h2>{title}</h2><p>{description}</p></div><div className="cta-actions"><Link href="/contact" className="button button-light">Start a Campaign <ArrowUpRight size={16} /></Link><Link href="/contact" className="button button-outline">Contact Our Team <ArrowUpRight size={16} /></Link></div></section>;
}
