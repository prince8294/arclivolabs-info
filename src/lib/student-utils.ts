import { randomBytes } from "node:crypto";

export function generateStudentId(): string {
  const number = Math.floor(1000 + Math.random() * 9000);
  return `ARCL-STU-${number}`;
}

export function generateReferralCode(name?: string): string {
  const cleanName = (name ?? "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 5)
    .toUpperCase();
  const randomSuffix = randomBytes(2).toString("hex").toUpperCase();
  const prefix = cleanName.length >= 3 ? cleanName : "ARCL";
  return `${prefix}${randomSuffix}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

