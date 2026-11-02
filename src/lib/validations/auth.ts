import { z } from "zod";
import { cleanText, emailAddress, phoneNumber } from "@/lib/validations/common";

export const registerSchema = z.object({
  name: cleanText(120, 2),
  email: emailAddress,
  password: z.string()
    .min(12, "Password must be at least 12 characters.")
    .max(128)
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol."),
  phone: phoneNumber.optional(),
  role: z.enum(["brand", "creator"]).default("brand"),
});

export const loginSchema = z.object({
  email: emailAddress,
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: registerSchema.shape.password,
});

export const forgotPasswordSchema = z.object({ email: emailAddress });
export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: registerSchema.shape.password,
});

export const updateUserSchema = z.object({
  name: cleanText(120, 2).optional(),
  phone: phoneNumber.optional(),
  profileImage: z.string().trim().url().max(2048).optional(),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
