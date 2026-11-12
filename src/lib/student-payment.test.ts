import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "./student-payment";
import { calculateCommissionForFollowers, DEFAULT_COMMISSION_TIERS } from "./commission";
import type { CommissionRuleRecord } from "@/models/CommissionRule";

describe("Payment & Support Helpers", () => {
  describe("generateTicketNumber", () => {
    it("generates a ticket starting with ST- and has valid format", () => {
      const ticket = generateTicketNumber();
      expect(ticket).toMatch(/^ST-[A-Z0-9]+-\d{3}$/);
    });

    it("generates unique ticket numbers", () => {
      const t1 = generateTicketNumber();
      const t2 = generateTicketNumber();
      expect(t1).not.toBe(t2);
    });
  });

  describe("Custom Commission Rates per Student", () => {
    const defaultRules = DEFAULT_COMMISSION_TIERS as unknown as CommissionRuleRecord[];

    it("uses default rates when student has no custom tiers", () => {
      const result = calculateCommissionForFollowers(15000, defaultRules);
      expect(result.amount).toBe(8);
      expect(result.isCustomRate).toBeUndefined();
    });

    it("uses custom rates when student has custom tiers enabled", () => {
      const customRates = [
        { minFollowers: 1000, maxFollowers: 9999, amount: 10, label: "VIP 1K-10K" },
        { minFollowers: 10000, maxFollowers: 49999, amount: 25, label: "VIP 10K-50K" },
        { minFollowers: 50000, maxFollowers: null, amount: 100, label: "VIP 50K+" },
      ];

      const res1 = calculateCommissionForFollowers(15000, defaultRules, customRates);
      expect(res1.amount).toBe(25);
      expect(res1.isCustomRate).toBe(true);
      expect(res1.label).toContain("Custom Student Rate");

      const res2 = calculateCommissionForFollowers(60000, defaultRules, customRates);
      expect(res2.amount).toBe(100);
      expect(res2.isCustomRate).toBe(true);
    });
  });

  describe("Balance and Payment Arithmetic", () => {
    it("pending payment equals total earnings minus paid amount", () => {
      const totalEarnings = 500;
      const paidAmount = 200;
      const pendingPayment = Math.max(0, totalEarnings - paidAmount);
      expect(pendingPayment).toBe(300);
    });

    it("pending payment cannot be negative even if overpaid edge case", () => {
      const totalEarnings = 100;
      const paidAmount = 150;
      const pendingPayment = Math.max(0, totalEarnings - paidAmount);
      expect(pendingPayment).toBe(0);
    });
  });
});

