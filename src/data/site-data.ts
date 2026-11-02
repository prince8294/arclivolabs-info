export type Creator = {
  slug: string;
  name: string;
  category: string;
  platform: string;
  followers: string;
  location: string;
  image: string;
  isDemo?: boolean;
};

export type CaseStudy = {
  slug: string;
  brand: string;
  industry: string;
  objective: string;
  result: string;
  image: string;
  tone: string;
};

export type ServiceIconName = "sparkles" | "search" | "camera" | "share" | "handshake" | "chart";
export type Service = { title: string; description: string; icon: ServiceIconName; detail: string };
export type Article = { slug: string; category: string; title: string; date: string; readTime: string; image: string; excerpt: string };

export const services: Service[] = [
  { title: "Influencer Marketing", description: "Thoughtful creator partnerships built around your brand and audience.", icon: "sparkles", detail: "We build creator-led campaigns around a clear point of view, an audience that matters, and the right measures of success." },
  { title: "Creator Discovery", description: "Find the voices whose values and communities align with yours.", icon: "search", detail: "Our discovery process looks beyond follower counts to find creators whose content, community, and values fit your brief." },
  { title: "UGC Content Production", description: "Made-for-social content with a human point of view.", icon: "camera", detail: "Brief, produce, and license creator-made assets that feel natural in-feed and useful across your marketing channels." },
  { title: "Social Media Campaigns", description: "Platform-aware ideas designed to earn real attention.", icon: "share", detail: "From channel selection to publishing cadence, we coordinate creator campaigns built for how people actually use social." },
  { title: "Brand Partnerships", description: "Long-term relationships that grow more meaningful over time.", icon: "handshake", detail: "We help brands and creators move from one-off posts to considered partnerships rooted in mutual value." },
  { title: "Campaign Management", description: "One experienced team from first brief to final wrap-up.", icon: "chart", detail: "We manage the moving parts: creator communication, timelines, content reviews, publishing, and clear reporting." },
];

export const creators: Creator[] = [
  { slug: "amara-cole", name: "Amara Cole", category: "Style & culture", platform: "Instagram", followers: "42K", location: "London, UK", image: "/images/creator-amara.jpg", isDemo: true },
  { slug: "noah-bennett", name: "Noah Bennett", category: "Travel", platform: "YouTube", followers: "86K", location: "Toronto, CA", image: "/images/creator-noah.jpg", isDemo: true },
  { slug: "mina-park", name: "Mina Park", category: "Food & living", platform: "TikTok", followers: "128K", location: "Seoul, KR", image: "/images/creator-mina.jpg", isDemo: true },
  { slug: "elias-reed", name: "Elias Reed", category: "Fitness", platform: "Instagram", followers: "31K", location: "New York, US", image: "/images/creator-elias.jpg", isDemo: true },
  { slug: "sofia-mendes", name: "Sofia Mendes", category: "Beauty", platform: "TikTok", followers: "204K", location: "Lisbon, PT", image: "/images/creator-sofia.jpg", isDemo: true },
  { slug: "kai-morgan", name: "Kai Morgan", category: "Design", platform: "YouTube", followers: "57K", location: "Melbourne, AU", image: "/images/creator-kai.jpg", isDemo: true },
];

export const caseStudies: CaseStudy[] = [
  { slug: "studio-north-demo", brand: "HOME & LIVING CONCEPT", industry: "Lifestyle", objective: "Introduce a considered home collection through real everyday rituals.", result: "Campaign concept · no client or performance claims.", image: "/images/concept-living.jpg", tone: "sand" },
  { slug: "good-form-demo", brand: "WELLNESS LAUNCH CONCEPT", industry: "Wellness", objective: "Build a social-first launch around useful, creator-led routines.", result: "Campaign concept · no client or performance claims.", image: "/images/concept-wellness.jpg", tone: "lavender" },
  { slug: "daylight-co-demo", brand: "FOOD & DRINK CONCEPT", industry: "Food & drink", objective: "Turn a familiar daily ritual into a fresh creator story.", result: "Campaign concept · no client or performance claims.", image: "/images/concept-food.jpg", tone: "rose" },
];

export const articles: Article[] = [
  { slug: "influence-with-intention", category: "Perspective", title: "What does influence with intention look like?", date: "SAMPLE ARTICLE", readTime: "5 min read", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85", excerpt: "A sample editorial introduction to the choices that make creator partnerships feel thoughtful, useful, and human." },
  { slug: "the-right-creator-fit", category: "Creator strategy", title: "Beyond follower counts: finding the right creator fit", date: "SAMPLE ARTICLE", readTime: "4 min read", image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85", excerpt: "A sample article exploring audience alignment, creative voice, and shared values." },
  { slug: "building-better-briefs", category: "Guides", title: "A better brief makes room for better ideas", date: "SAMPLE ARTICLE", readTime: "6 min read", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85", excerpt: "Sample content about giving creators direction without taking away their point of view." },
];
