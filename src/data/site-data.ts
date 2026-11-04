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

export type ServiceIconName = "sparkles" | "search" | "camera" | "share" | "handshake" | "chart";
export type Service = { title: string; description: string; icon: ServiceIconName; detail: string };

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

