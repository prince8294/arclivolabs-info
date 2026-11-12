"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Filter,
  MessageSquare,
  Search,
  Sparkles,
  Info,
} from "lucide-react";

function InstagramIcon({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

type Template = {
  id: string;
  category:
    | "first_time"
    | "invitation"
    | "follow_up"
    | "interested_replies"
    | "reminders"
    | "short_replies";
  categoryLabel: string;
  title: string;
  recommendedFor: string;
  templateText: string;
};

const rawTemplates: Template[] = [
  // 1. First-time creator outreach (4 templates)
  {
    id: "ft-1",
    category: "first_time",
    categoryLabel: "First-time outreach",
    title: "Compliment & Niche Campaign Fit",
    recommendedFor: "Cold outreach to creators with high visual quality or viral reels",
    templateText:
      "Hey {Creator_Name}! Loved your recent reel on {Content_Topic} — your aesthetic and engagement are incredible. We're currently matching creators in your niche with premium brand campaigns at ArclivoLabs. Would love to share a few campaign briefs with you. Are you open to brand collaborations this month?",
  },
  {
    id: "ft-2",
    category: "first_time",
    categoryLabel: "First-time outreach",
    title: "Direct Paid Sponsorship Opportunity",
    recommendedFor: "Micro & mid-tier creators actively doing lifestyle/tech content",
    templateText:
      "Hi {Creator_Name}! ArclivoLabs is currently curating a roster of standout creators for upcoming paid brand campaigns in {Content_Topic}. We think your content is an ideal fit. If you're open to paid sponsorships, let me know and I can send over our creator onboarding details!",
  },
  {
    id: "ft-3",
    category: "first_time",
    categoryLabel: "First-time outreach",
    title: "High-Growth Creator Spotlight",
    recommendedFor: "Rising creators whose engagement and followers are growing fast",
    templateText:
      "Hey {Creator_Name}, stumbled across your page and had to reach out! Your content quality is top-tier. I work with ArclivoLabs, a creator marketing agency connecting rising influencers with paid brand deals. We'd love to have you on our verified creator roster. Can I share a quick invite with you?",
  },
  {
    id: "ft-4",
    category: "first_time",
    categoryLabel: "First-time outreach",
    title: "Community Trust & Engagement Pitch",
    recommendedFor: "Niche creators with loyal communities (food, fitness, beauty)",
    templateText:
      "Hey {Creator_Name}! Love your work in the {Content_Topic} space. At ArclivoLabs, we specifically look for creators with strong audience trust and authentic engagement like yours for upcoming brand campaigns. Would you be interested in receiving collaboration briefs?",
  },

  // 2. Creator registration invitation (4 templates)
  {
    id: "inv-1",
    category: "invitation",
    categoryLabel: "Registration invitation",
    title: "VIP Network Invitation with Referral Code",
    recommendedFor: "Creators who expressed interest in joining campaigns",
    templateText:
      "Hi {Creator_Name}! We'd love to officially invite you to join the ArclivoLabs creator network. It gives you direct access to paid brand deals, campaign briefs, and agency representation. You can register your profile here: {Registration_Link} using my priority referral code: {My_Referral_Code}. Excited to work together!",
  },
  {
    id: "inv-2",
    category: "invitation",
    categoryLabel: "Registration invitation",
    title: "Fast-Track Onboarding Link",
    recommendedFor: "Giving a creator a direct link with expedited verification",
    templateText:
      "Hey {Creator_Name}, here is the fast-track link to join our creator network: {Registration_Link}. Be sure to enter referral code \"{My_Referral_Code}\" during registration so our agency team can prioritize your profile review for our next campaign cycle!",
  },
  {
    id: "inv-3",
    category: "invitation",
    categoryLabel: "Registration invitation",
    title: "Zero-Fee Agency Representation Pitch",
    recommendedFor: "Addressing any hesitation about costs or contracts",
    templateText:
      "Hello {Creator_Name}! Joining ArclivoLabs is 100% free for creators — zero fees. We connect you with top brands for sponsored reels, stories, and barter campaigns. Sign up at {Registration_Link} with referral code \"{My_Referral_Code}\" to get started. Let me know once you submit your details!",
  },
  {
    id: "inv-4",
    category: "invitation",
    categoryLabel: "Registration invitation",
    title: "Short Invitation with Direct Link",
    recommendedFor: "Casual, fast messaging on Instagram DMs",
    templateText:
      "Hey {Creator_Name}! Here's your invite to get on our brand roster: {Registration_Link} (Referral code: {My_Referral_Code}). Once verified, you'll start receiving paid campaign briefs suited to your audience!",
  },

  // 3. Follow-up messages (4 templates)
  {
    id: "fu-1",
    category: "follow_up",
    categoryLabel: "Follow-up messages",
    title: "Gentle 48-Hour Ping",
    recommendedFor: "When creator hasn't replied to initial pitch after 2 days",
    templateText:
      "Hey {Creator_Name}, just following up on my previous message! Know DMs can get crazy busy. We're locking in creator slots for our upcoming campaign lineup this week — would love to include you if you're interested!",
  },
  {
    id: "fu-2",
    category: "follow_up",
    categoryLabel: "Follow-up messages",
    title: "Campaign Slots Closing Soon",
    recommendedFor: "Creating gentle urgency for upcoming campaign rosters",
    templateText:
      "Hi {Creator_Name}! Quick check-in — our team is finalizing creator rosters for this month's brand campaigns. If you'd like to be considered, here's the quick registration link: {Registration_Link} (code: {My_Referral_Code}). Let me know if you have any questions!",
  },
  {
    id: "fu-3",
    category: "follow_up",
    categoryLabel: "Follow-up messages",
    title: "Value Reiteration Follow-up",
    recommendedFor: "Re-engaging a creator who read the message but didn't respond",
    templateText:
      "Hey {Creator_Name}! Reaching back out in case this got buried. ArclivoLabs works directly with brands to secure fair pay and creative freedom for creators. Zero joining fee. Let me know if you'd like to take a look at our current brand openings!",
  },
  {
    id: "fu-4",
    category: "follow_up",
    categoryLabel: "Follow-up messages",
    title: "Second Friendly Touchpoint",
    recommendedFor: "Warm check-in before moving on",
    templateText:
      "Hey {Creator_Name}! Hope you're having a productive week. Just wanted to see if you had a moment to check out the ArclivoLabs creator invite. We'd really love to feature your profile for our partner brands!",
  },

  // 4. Interested creator replies (4 templates)
  {
    id: "int-1",
    category: "interested_replies",
    categoryLabel: "Interested creator replies",
    title: "How It Works Breakdown",
    recommendedFor: "When creator replies asking 'How does this work?'",
    templateText:
      "Awesome to hear from you, {Creator_Name}! Here's how it works: Once you register at {Registration_Link} (enter referral code: {My_Referral_Code}), our team reviews your profile and matches you with brands looking for your specific niche and demographic. You receive campaign briefs, set your rates, and decide which deals to accept!",
  },
  {
    id: "int-2",
    category: "interested_replies",
    categoryLabel: "Interested creator replies",
    title: "Addressing Pay & Commercial Rates",
    recommendedFor: "When creator asks 'How much do you pay?' or 'Do I get paid?'",
    templateText:
      "Great question, {Creator_Name}! You maintain complete control over your commercial rates and deliverable terms. We pitch you to brands, negotiate on your behalf, and guarantee timely payouts. You can register your media kit and rates at {Registration_Link} with code {My_Referral_Code}!",
  },
  {
    id: "int-3",
    category: "interested_replies",
    categoryLabel: "Interested creator replies",
    title: "Explaining Zero Agency Charges",
    recommendedFor: "When creator asks if there is any fee or contract binding",
    templateText:
      "Hey {Creator_Name}! There are absolutely zero upfront fees or hidden charges for creators. We get paid by the brands, not the creators. Simply create your account here: {Registration_Link} using referral code {My_Referral_Code} and you're good to go!",
  },
  {
    id: "int-4",
    category: "interested_replies",
    categoryLabel: "Interested creator replies",
    title: "Step-by-Step Onboarding Walkthrough",
    recommendedFor: "Guiding an interested creator through registration",
    templateText:
      "Glad you're interested, {Creator_Name}! Getting started takes 2 minutes: 1) Go to {Registration_Link} 2) Enter code {My_Referral_Code} 3) Add your Instagram handle & category. Our team will verify your account and you'll be on our priority list!",
  },

  // 5. Registration reminders (3 templates)
  {
    id: "rem-1",
    category: "reminders",
    categoryLabel: "Registration reminders",
    title: "Profile Completion Reminder",
    recommendedFor: "When creator said they'd register but haven't yet",
    templateText:
      "Hey {Creator_Name}! Saw that you started checking out ArclivoLabs — make sure to complete your registration using referral code {My_Referral_Code} at {Registration_Link} so we can officially add you to the brand shortlist for next week!",
  },
  {
    id: "rem-2",
    category: "reminders",
    categoryLabel: "Registration reminders",
    title: "Referral Box Reminder",
    recommendedFor: "Ensuring they don't forget to enter your code",
    templateText:
      "Hi {Creator_Name}, quick reminder when signing up at {Registration_Link}: please remember to enter referral code \"{My_Referral_Code}\" in the referral box so your application is expedited directly to our onboarding manager!",
  },
  {
    id: "rem-3",
    category: "reminders",
    categoryLabel: "Registration reminders",
    title: "Campaign Roster Closing Reminder",
    recommendedFor: "Last call before brand roster submissions",
    templateText:
      "Hey {Creator_Name}! The deadline to apply for our upcoming brand collabs is approaching. If you haven't finished signing up yet, head over to {Registration_Link} and apply with code {My_Referral_Code}. Let me know once done!",
  },

  // 6. Short professional replies (3 templates)
  {
    id: "sh-1",
    category: "short_replies",
    categoryLabel: "Short professional replies",
    title: "Quick Link Send",
    recommendedFor: "When creator simply replies 'Send link' or 'Sure'",
    templateText:
      "Thanks for the reply, {Creator_Name}! Here is the direct link to register: {Registration_Link} — use my referral code {My_Referral_Code}. Let me know as soon as you're in!",
  },
  {
    id: "sh-2",
    category: "short_replies",
    categoryLabel: "Short professional replies",
    title: "Email / WhatsApp Handoff",
    recommendedFor: "When creator prefers WhatsApp or Email over Instagram DMs",
    templateText:
      "Sounds great, {Creator_Name}! If you prefer communicating over WhatsApp or Email, feel free to drop your contact details or email support@arclivolabs.com with referral code {My_Referral_Code}. Look forward to collaborating!",
  },
  {
    id: "sh-3",
    category: "short_replies",
    categoryLabel: "Short professional replies",
    title: "Thank You & Onboarding Confirmation",
    recommendedFor: "When creator confirms they registered",
    templateText:
      "Thank you so much, {Creator_Name}! Received your details. Our agency team will review your profile and reach out with your first campaign brief soon. Have a great day ahead!",
  },
];

const categoryList = [
  { key: "all", label: "All Templates (22)" },
  { key: "first_time", label: "First-Time Outreach (4)" },
  { key: "invitation", label: "Registration Invitation (4)" },
  { key: "follow_up", label: "Follow-Up (4)" },
  { key: "interested_replies", label: "Interested Replies (4)" },
  { key: "reminders", label: "Reminders (3)" },
  { key: "short_replies", label: "Short Replies (3)" },
];

export function DmTemplates() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [referralCode, setReferralCode] = useState("YOUR_CODE");
  const [customCreatorName, setCustomCreatorName] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load student referral code
  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await fetch("/api/student/me", { credentials: "same-origin" });
        const json = await res.json();
        if (res.ok && json.success && json.data?.student?.referralCode) {
          setReferralCode(json.data.student.referralCode);
        }
      } catch {
        // Fallback to default
      }
    }
    loadStudent();
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://arclivolabs.com";
  const regLink = `${origin}/join-as-creator/${referralCode}`;

  function formatTemplate(text: string): string {
    const name = customCreatorName.trim() || "[Creator Name]";
    const topic = customTopic.trim() || "[their niche/topic]";
    return text
      .replace(/{Creator_Name}/g, name)
      .replace(/{Content_Topic}/g, topic)
      .replace(/{My_Referral_Code}/g, referralCode)
      .replace(/{Registration_Link}/g, regLink);
  }

  function handleCopy(id: string, text: string) {
    const formatted = formatTemplate(text);
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredTemplates = rawTemplates.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.templateText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recommendedFor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold tracking-widest text-[#7459d2] uppercase">
            Outreach Toolkit
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7459d2] text-[10px] font-bold border border-purple-100">
            22 Templates
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Instagram DM Templates</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Ready-to-use message templates for reaching out to creators on Instagram. Copy with one click
          and send manually from your Instagram account.
        </p>
      </div>

      {/* Manual Outreach Notice */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-amber-950">Important Ambassador Notice:</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Students send outreach messages <strong>manually</strong> using their own personal Instagram accounts.
            Never use automated DM bots or scrapers, as this violates platform policies. Customize each message
            with the creator&apos;s name for best conversion.
          </p>
        </div>
      </div>

      {/* Dynamic Placeholder Customizer */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-[#7459d2]" />
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Live Template Personalizer
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Creator&apos;s Name</label>
            <input
              type="text"
              value={customCreatorName}
              onChange={(e) => setCustomCreatorName(e.target.value)}
              placeholder="e.g. Pooja / @pooja_creations"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
            />
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">Content Niche / Topic</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. fashion styling / tech reviews"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
            />
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">Your Referral Code</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full font-mono uppercase font-bold text-[#7459d2] px-3 py-1.5 border border-purple-200 bg-purple-50/50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2]"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by keywords, category, or recommendation..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7459d2]/20 focus:border-[#7459d2] shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categoryList.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? "bg-[#171828] text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
            <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700">No matching templates found</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing your search query or choosing another category.</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const formattedMessage = formatTemplate(template.templateText);
            const isCopied = copiedId === template.id;

            return (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col justify-between hover:border-gray-300 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {template.categoryLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formattedMessage.length} chars
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#7459d2] transition-colors">
                    {template.title}
                  </h3>

                  <p className="text-[11px] text-gray-400 mt-1 italic">
                    💡 {template.recommendedFor}
                  </p>

                  {/* Message Box */}
                  <div className="mt-3 p-3.5 bg-gray-50/80 rounded-lg border border-gray-200/80 text-xs text-gray-800 leading-relaxed font-normal whitespace-pre-wrap select-all">
                    {formattedMessage}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <InstagramIcon size={13} className="text-pink-600" />
                    <span>Instagram DM Ready</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(template.id, template.templateText)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-[#7459d2] hover:bg-[#6247bf] text-white shadow-xs"
                    }`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? "Copied!" : "Copy Template"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
