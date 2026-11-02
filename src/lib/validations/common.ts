import { z } from "zod";

export const cleanText = (max: number, min = 1) =>
  z.string()
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().min(min).max(max));

export const emailAddress = z.string().trim().toLowerCase().email().max(254);
export const phoneNumber = z.string().trim().min(7).max(32);
export const safeUrl = z.string().trim().url().max(2048);
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "A valid record ID is required.");

export function normalizeSocialUsername(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/^@/, "").toLowerCase();
  return normalized || undefined;
}
