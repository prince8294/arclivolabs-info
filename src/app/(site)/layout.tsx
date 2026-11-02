import { Navigation, Footer } from "@/components/navigation";
import { PageTransition } from "@/components/page-transition";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><Navigation /><PageTransition>{children}</PageTransition><Footer /></>;
}
