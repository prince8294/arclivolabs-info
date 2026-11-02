import type { UserRole } from "@/models/User";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    sessionVersion?: number;
  }
}
