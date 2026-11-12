import CommissionRule, { type CommissionRuleRecord } from "@/models/CommissionRule";
import { connectToDatabase } from "@/lib/db";

export type CommissionTierDefinition = {
  tierKey: string;
  minFollowers: number;
  maxFollowers: number | null;
  label: string;
  amount: number;
  currency: string;
  order: number;
};

export const DEFAULT_COMMISSION_TIERS: CommissionTierDefinition[] = [
  { tierKey: "tier_1k_10k", minFollowers: 1000, maxFollowers: 9999, label: "1K–10K", amount: 5, currency: "INR", order: 1 },
  { tierKey: "tier_10k_25k", minFollowers: 10000, maxFollowers: 24999, label: "10K–25K", amount: 8, currency: "INR", order: 2 },
  { tierKey: "tier_25k_50k", minFollowers: 25000, maxFollowers: 49999, label: "25K–50K", amount: 12, currency: "INR", order: 3 },
  { tierKey: "tier_50k_100k", minFollowers: 50000, maxFollowers: 99999, label: "50K–100K", amount: 15, currency: "INR", order: 4 },
  { tierKey: "tier_100k_200k", minFollowers: 100000, maxFollowers: 199999, label: "100K–200K", amount: 20, currency: "INR", order: 5 },
  { tierKey: "tier_200k_500k", minFollowers: 200000, maxFollowers: 499999, label: "200K–500K", amount: 30, currency: "INR", order: 6 },
  { tierKey: "tier_500k_plus", minFollowers: 500000, maxFollowers: null, label: "500K+", amount: 40, currency: "INR", order: 7 },
];

export async function getOrInitializeCommissionRules(): Promise<CommissionRuleRecord[]> {
  await connectToDatabase();
  let rules = await CommissionRule.find({ isActive: true }).sort({ order: 1 }).lean();

  if (!rules || rules.length === 0) {
    // Seed default tiers
    await CommissionRule.insertMany(DEFAULT_COMMISSION_TIERS);
    rules = await CommissionRule.find({ isActive: true }).sort({ order: 1 }).lean();
  }

  return rules as CommissionRuleRecord[];
}

export type CustomRate = {
  minFollowers: number;
  maxFollowers: number | null;
  amount: number;
  label: string;
};

export function calculateCommissionForFollowers(
  followers: number,
  rules: CommissionRuleRecord[],
  customRates?: CustomRate[] | null
): { amount: number; label: string; currency: string; tierKey: string; isCustomRate?: boolean } {
  // If student has custom rates, check them first
  if (customRates && customRates.length > 0) {
    const sortedCustom = [...customRates].sort((a, b) => b.minFollowers - a.minFollowers);
    for (const tier of sortedCustom) {
      if (followers >= tier.minFollowers) {
        if (tier.maxFollowers === null || tier.maxFollowers === undefined || followers <= tier.maxFollowers) {
          return {
            amount: tier.amount,
            label: `${tier.label} (Custom Student Rate)`,
            currency: "INR",
            tierKey: `custom_${tier.minFollowers}`,
            isCustomRate: true,
          };
        }
      }
    }
  }

  // Sort descending by minFollowers to find highest matching threshold
  const sorted = [...rules].sort((a, b) => b.minFollowers - a.minFollowers);

  for (const tier of sorted) {
    if (followers >= tier.minFollowers) {
      if (tier.maxFollowers === null || tier.maxFollowers === undefined || followers <= tier.maxFollowers) {
        return {
          amount: tier.amount,
          label: tier.label,
          currency: tier.currency || "INR",
          tierKey: tier.tierKey,
        };
      }
    }
  }

  return {
    amount: 0,
    label: "Under 1K (No Commission)",
    currency: "INR",
    tierKey: "under_1k",
  };
}

export function normalizeInstagramHandle(input: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  // Strip url parts: https://www.instagram.com/username/?hl=en -> username
  clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "");
  // Strip query parameters and trailing slashes
  clean = clean.split("?")[0].split("/")[0];
  // Strip leading @
  clean = clean.replace(/^@+/, "");
  return clean.trim();
}
