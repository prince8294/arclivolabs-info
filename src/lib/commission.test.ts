import { describe, it, expect } from "vitest";
import {
  normalizeInstagramHandle,
  calculateCommissionForFollowers,
  DEFAULT_COMMISSION_TIERS,
} from "./commission";
import type { CommissionRuleRecord } from "@/models/CommissionRule";

describe("Commission System Tests", () => {
  describe("Instagram Handle Normalization", () => {
    it("strips leading @ symbol and lowercases", () => {
      expect(normalizeInstagramHandle("@JohnDoe")).toBe("johndoe");
      expect(normalizeInstagramHandle("@@JaneDoe")).toBe("janedoe");
    });

    it("extracts username from Instagram full URLs", () => {
      expect(normalizeInstagramHandle("https://www.instagram.com/alex_creator/")).toBe("alex_creator");
      expect(normalizeInstagramHandle("http://instagram.com/creator_hub?igshid=xyz123")).toBe("creator_hub");
    });

    it("handles whitespace and edge cases", () => {
      expect(normalizeInstagramHandle("  @cool_creator  ")).toBe("cool_creator");
      expect(normalizeInstagramHandle("")).toBe("");
    });
  });

  describe("Follower-Based Commission Calculation", () => {
    const tiers = DEFAULT_COMMISSION_TIERS as unknown as CommissionRuleRecord[];

    it("returns zero for followers under 1,000", () => {
      const result = calculateCommissionForFollowers(500, tiers);
      expect(result.amount).toBe(0);
      expect(result.tierKey).toBe("under_1k");
    });

    it("calculates 1K–10K tier accurately (₹5)", () => {
      expect(calculateCommissionForFollowers(1000, tiers).amount).toBe(5);
      expect(calculateCommissionForFollowers(5500, tiers).amount).toBe(5);
      expect(calculateCommissionForFollowers(9999, tiers).amount).toBe(5);
    });

    it("calculates 10K–25K tier accurately (₹8)", () => {
      expect(calculateCommissionForFollowers(10000, tiers).amount).toBe(8);
      expect(calculateCommissionForFollowers(24999, tiers).amount).toBe(8);
    });

    it("calculates 25K–50K tier accurately (₹12)", () => {
      expect(calculateCommissionForFollowers(25000, tiers).amount).toBe(12);
      expect(calculateCommissionForFollowers(49999, tiers).amount).toBe(12);
    });

    it("calculates 50K–100K tier accurately (₹15)", () => {
      expect(calculateCommissionForFollowers(50000, tiers).amount).toBe(15);
      expect(calculateCommissionForFollowers(99999, tiers).amount).toBe(15);
    });

    it("calculates 100K–200K tier accurately (₹20)", () => {
      expect(calculateCommissionForFollowers(100000, tiers).amount).toBe(20);
      expect(calculateCommissionForFollowers(199999, tiers).amount).toBe(20);
    });

    it("calculates 200K–500K tier accurately (₹30)", () => {
      expect(calculateCommissionForFollowers(200000, tiers).amount).toBe(30);
      expect(calculateCommissionForFollowers(499999, tiers).amount).toBe(30);
    });

    it("calculates 500K+ tier accurately (₹40)", () => {
      expect(calculateCommissionForFollowers(500000, tiers).amount).toBe(40);
      expect(calculateCommissionForFollowers(2500000, tiers).amount).toBe(40);
      expect(calculateCommissionForFollowers(500000, tiers).label).toBe("500K+");
    });
  });
});

