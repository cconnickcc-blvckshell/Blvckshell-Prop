import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { isUserActive } from "./active-user";
import { logError } from "./logger";
import { prisma } from "./prisma";
import { safeRedirectTarget } from "./safe-redirect";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            worker: {
              include: {
                workforceAccount: true,
              },
            },
            workforceAccount: true,
          },
        });
        // clientOrganizationId is on User; no need to include relation for JWT

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workforceAccountId: user.workforceAccountId ?? undefined,
          workerId: user.worker?.id,
          clientOrganizationId: user.clientOrganizationId ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (per SECURITY.md)
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return new URL(safeRedirectTarget(url, baseUrl, "/portal"), baseUrl).toString();
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workforceAccountId = user.workforceAccountId;
        token.workerId = user.workerId;
        token.clientOrganizationId = user.clientOrganizationId;
      }

      // Existing JWTs stay valid for maxAge unless we re-check. Returning null
      // clears the session (Auth.js treats a null jwt callback result as signed out).
      const userId = typeof token.id === "string" ? token.id : null;
      if (userId) {
        try {
          const active = await isUserActive(userId);
          if (!active) return null;
        } catch (error) {
          logError(error, { where: "auth.jwt.isActive", userId });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.workforceAccountId = token.workforceAccountId as string | undefined;
        session.user.workerId = token.workerId as string | undefined;
        session.user.clientOrganizationId = token.clientOrganizationId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
