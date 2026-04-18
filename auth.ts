import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminEmailsFromEnv, env } from "@/lib/env";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/gmail.readonly"
          ].join(" ")
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const authorized = await prisma.authorizedEmail.findUnique({
        where: { email }
      });
      const envAdmins = adminEmailsFromEnv();

      if (!authorized && !envAdmins.includes(email)) {
        return false;
      }

      const roleCode = envAdmins.includes(email)
        ? RoleCode.ADMIN
        : (authorized?.roleCode ?? RoleCode.USER);

      const role = await prisma.role.upsert({
        where: { code: roleCode },
        update: {},
        create: {
          code: roleCode,
          name: roleCode === RoleCode.ADMIN ? "Admin" : "User"
        }
      });

      await prisma.user.upsert({
        where: { email },
        update: {
          isActive: true,
          roles: { connect: [{ id: role.id }] }
        },
        create: {
          email,
          name: user.name,
          image: user.image,
          roles: { connect: [{ id: role.id }] }
        }
      });

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { roles: true }
        });
        session.user.roles = dbUser?.roles.map((role) => role.code) ?? [];
        session.user.isActive = dbUser?.isActive ?? false;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
