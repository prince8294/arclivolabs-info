import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ApiError } from "@/lib/api-response";
import { loginSchema } from "@/lib/validations/auth";
import { verifyCredentials } from "@/services/auth.service";
import { userRoles } from "@/models/User";

const secureCookies = process.env.NODE_ENV === "production";

export const sessionCookieName = secureCookies
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export const sessionMaxAge = 60 * 60 * 8;

export const authConfig: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: sessionMaxAge },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return verifyCredentials(parsed.data);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const role = userRoles.find((candidate) => candidate === token.role);
        if (role) session.user.role = role;
        if (typeof token.sessionVersion === "number") session.user.sessionVersion = token.sessionVersion;
      }
      return session;
    },
  },
};

export async function auth() {
  if (!authConfig.secret) throw new ApiError("Authentication is not configured.", 503);
  return getServerSession(authConfig);
}
export const authHandler = NextAuth(authConfig);
