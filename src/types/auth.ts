import type { UserRole } from "@/models/User";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Extract<UserRole, "brand" | "creator">;
};
