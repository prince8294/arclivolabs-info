"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Info,
  MessageSquare,
  Search,
  Sparkles,
  Users,
  X,
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
  const [referralCode, setReferralCode] = useState("ARCLIVO");
  const [customCreatorName, setCustomCreatorName] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

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
    setNotice("Outreach template copied to clipboard!");
    setTimeout(() => {
      setCopiedId(null);
      setNotice("");
    }, 2500);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">OUTREACH RESOURCES & COPYWRITING</span>
          <h1>Instagram DM Templates</h1>
          <p>
            Tested, high-converting direct messaging templates to pitch creators, address commercial rates, and guide them to register with your referral link.
          </p>
        </div>

        <div className="admin-heading-actions">
          <Link
            href="/student/creators-referred"
            className="admin-button admin-button-secondary"
          >
            <Users size={14} />
            <span>View Referred Creators</span>
          </Link>
        </div>
      </div>

      {notice && (
        <p className="admin-toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={14} />
          </button>
        </p>
      )}

      {/* Ambassador Best Practice Notice */}
      <div
        className="admin-panel admin-panel-padding"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: "#fcfcff",
          borderLeft: "3px solid #7257ce",
        }}
      >
        <Info size={16} style={{ color: "#7257ce", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <b style={{ fontSize: "11px", color: "#2d3045" }}>Manual Outreach Protocol</b>
          <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#777a8e", lineHeight: "1.5" }}>
            Ambassadors send outreach messages manually from their personal Instagram accounts. Never use automated DM bots, scrapers, or spam methods, which violate Instagram platform policies. Personalize each template for higher response rates.
          </p>
        </div>
      </div>

      {/* Live Template Personalizer */}
      <div className="admin-panel admin-panel-padding">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Sparkles size={14} style={{ color: "#7257ce" }} />
          <h2 style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d3045", margin: 0 }}>
            Live Template Personalizer
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "10.5px", fontWeight: "600", color: "#65687b", marginBottom: "5px" }}>
              Creator&apos;s First Name
            </label>
            <input
              type="text"
              value={customCreatorName}
              onChange={(e) => setCustomCreatorName(e.target.value)}
              placeholder="e.g. Pooja / Rohan"
              style={{
                width: "100%",
                height: "36px",
                padding: "0 11px",
                fontSize: "11px",
                border: "1px solid #e2e4ec",
                borderRadius: "6px",
                outline: 0,
                color: "#282a3c",
                background: "white",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "10.5px", fontWeight: "600", color: "#65687b", marginBottom: "5px" }}>
              Content Niche / Topic
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. skincare styling / tech reviews"
              style={{
                width: "100%",
                height: "36px",
                padding: "0 11px",
                fontSize: "11px",
                border: "1px solid #e2e4ec",
                borderRadius: "6px",
                outline: 0,
                color: "#282a3c",
                background: "white",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "10.5px", fontWeight: "600", color: "#65687b", marginBottom: "5px" }}>
              Your Referral Code
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                height: "36px",
                padding: "0 11px",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: "700",
                letterSpacing: "0.06em",
                border: "1px solid #cec6f2",
                borderRadius: "6px",
                outline: 0,
                color: "#7257ce",
                background: "#f9f8ff",
              }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Category Pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="admin-toolbar" style={{ marginBottom: 0 }}>
          <div className="admin-search" style={{ minWidth: "280px" }}>
            <Search size={14} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by keyword, tone, or recommendation…"
            />
          </div>

          <div className="admin-filter-note">
            Showing <b>{filteredTemplates.length}</b> of {rawTemplates.length} templates
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
          {categoryList.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                padding: "6px 12px",
                fontSize: "10.5px",
                fontWeight: selectedCategory === cat.key ? "650" : "500",
                borderRadius: "6px",
                border: selectedCategory === cat.key ? "1px solid #7257ce" : "1px solid #e5e6ee",
                background: selectedCategory === cat.key ? "#7257ce" : "white",
                color: selectedCategory === cat.key ? "white" : "#65687b",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.16s",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "14px" }}>
        {filteredTemplates.length === 0 ? (
          <div className="admin-panel admin-empty-state" style={{ gridColumn: "1 / -1", minHeight: "240px" }}>
            <MessageSquare size={32} style={{ color: "#c4c7d6", marginBottom: "8px" }} />
            <b>No matching outreach templates found</b>
            <p style={{ margin: "5px 0 16px", fontSize: "11px", color: "#8b8fa2" }}>
              Try clearing your search query or choosing another category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="admin-button admin-button-secondary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const formattedMessage = formatTemplate(template.templateText);
            const isCopied = copiedId === template.id;

            return (
              <div
                key={template.id}
                className="admin-panel admin-panel-padding"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "border-color 0.16s, box-shadow 0.16s",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#7257ce",
                        background: "#f0edff",
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {template.categoryLabel}
                    </span>
                    <span style={{ fontSize: "9.5px", color: "#9da0af", fontFamily: "monospace" }}>
                      {formattedMessage.length} chars
                    </span>
                  </div>

                  <h3 style={{ fontSize: "13px", fontWeight: "650", color: "#25273a", margin: "0 0 4px" }}>
                    {template.title}
                  </h3>

                  <p style={{ fontSize: "10.5px", color: "#8b8fa0", margin: "0 0 12px", fontStyle: "italic" }}>
                    Recommended for: {template.recommendedFor}
                  </p>

                  <div
                    style={{
                      padding: "12px",
                      background: "#fafafc",
                      border: "1px solid #ebecef",
                      borderRadius: "7px",
                      fontSize: "11px",
                      lineHeight: "1.6",
                      color: "#35384c",
                      whiteSpace: "pre-wrap",
                      userSelect: "all",
                    }}
                  >
                    {formattedMessage}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid #f0f1f5",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", color: "#8d90a1" }}>
                    <InstagramIcon size={12} className="text-pink-600" />
                    <span>Instagram DM Ready</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(template.id, template.templateText)}
                    className={isCopied ? "admin-button" : "admin-button admin-button-secondary"}
                    style={isCopied ? { background: "#15845f", borderColor: "#15845f" } : {}}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied to Clipboard" : "Copy Template"}</span>
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
