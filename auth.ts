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
      allowDangerousEmailAccountLinking: true,
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
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase();
      if (!email) {
        console.warn("GiaFarm sign-in rejected: Google account has no email.");
        return false;
      }

      console.info(`GiaFarm sign-in: Google email received: ${email}.`);

      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
      });
      const linkedOAuthAccount =
        account?.provider && account.providerAccountId
          ? await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId
                }
              }
            })
          : null;

      console.info(
        [
          "GiaFarm sign-in account state:",
          `email=${email}`,
          `existingUser=${existingUser ? "yes" : "no"}`,
          `provider=${account?.provider ?? "unknown"}`,
          `oauthAccountLinked=${linkedOAuthAccount ? "yes" : "no"}`,
          `userLinkedProviders=${
            existingUser?.accounts.map((item) => item.provider).join(",") || "none"
          }`
        ].join(" ")
      );

      const authorized = await prisma.authorizedEmail.findUnique({
        where: { email }
      });
      const envAdmins = adminEmailsFromEnv();

      if (!authorized && !envAdmins.includes(email)) {
        console.warn(`GiaFarm sign-in rejected: ${email} is not whitelisted.`);
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

      console.info(
        `GiaFarm sign-in allowed: ${email} as ${roleCode} via ${account?.provider ?? "unknown"}.`
      );

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
