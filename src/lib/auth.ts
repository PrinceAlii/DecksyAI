import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import { Resend } from "resend";

import { recordAuditLog } from "@/lib/audit-log";
import { getServerEnv, isDevelopment } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type AuthOptionsResult = NextAuthOptions | null;

function createEmailProvider(env: ReturnType<typeof getServerEnv>) {
  return EmailProvider({
    from: env.EMAIL_FROM ?? "Decksy AI <login@decksy.dev>",
    maxAge: 10 * 60, // 10 minutes
    async sendVerificationRequest({ identifier, url }) {
      if (!env.RESEND_API_KEY) {
        if (isDevelopment()) {
          console.warn("RESEND_API_KEY missing. Magic link URL:", url);
        }
        return;
      }

      const resend = new Resend(env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: env.EMAIL_FROM ?? "Decksy AI <login@decksy.dev>",
        to: identifier,
        subject: "Your Decksy AI login link",
        html: `
          <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; background-color: #0B0F19; color: #E6EAF2;">
            <h1 style="margin-bottom: 12px;">Sign in to Decksy AI</h1>
            <p style="margin-bottom: 16px;">Click the secure button below to finish signing in. This link expires in 10 minutes.</p>
            <p style="margin-bottom: 24px;"><a href="${url}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background-color: #5B8CFF; color: #0B0F19; text-decoration: none; font-weight: 600;">Continue to Decksy AI</a></p>
            <p style="margin-bottom: 8px;">If you did not request this email you can safely ignore it.</p>
          </div>
        `,
        text: `Sign in to Decksy AI using the link below.\n\n${url}\n\nThis link expires in 10 minutes.`,
      });

      if (error) {
        throw new Error(`Failed to send verification email: ${error.message ?? error}`);
      }
    },
  });
}

function createAuthOptions(): NextAuthOptions {
  if (!prisma) {
    throw new Error("Authentication requires a configured database connection. Set DATABASE_URL before enabling auth.");
  }

  const env = getServerEnv();
  const providers: Array<ReturnType<typeof createEmailProvider> | ReturnType<typeof GithubProvider>> = [
    createEmailProvider(env),
  ];

  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
    providers.push(
      GithubProvider({
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
        allowDangerousEmailAccountLinking: false,
      }),
    );
  }

  return {
    adapter: PrismaAdapter(prisma),
    providers,
    secret: env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
    pages: {
      signIn: "/login",
      verifyRequest: "/login?status=check-email",
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub ?? session.user.id;
          if (token.email && !session.user.email) {
            session.user.email = token.email;
          }
          if (token.name && !session.user.name) {
            session.user.name = token.name as string;
          }
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
        }
        return token;
      },
    },
    events: {
      async createUser({ user }) {
        await recordAuditLog("auth.user_created", {
          actorId: user.id,
          metadata: { email: user.email ?? null },
        });
      },
      async signIn({ user, account }) {
        await recordAuditLog("auth.sign_in", {
          actorId: user.id,
          metadata: { provider: account?.provider ?? "unknown" },
        });
      },
      async signOut({ token }) {
        if (token?.sub) {
          await recordAuditLog("auth.sign_out", {
            actorId: token.sub,
            metadata: {},
          });
        }
      },
    },
    debug: isDevelopment(),
  };
}

const authOptionsCache: AuthOptionsResult = prisma ? createAuthOptions() : null;

export const authOptions = authOptionsCache;

export async function getServerAuthSession() {
  if (!authOptions) {
    return null;
  }

  try {
    return await getServerSession(authOptions);
  } catch (err: unknown) {
    // next-auth throws a MissingSecretError (code: 'NO_SECRET') in production
    // when no NEXTAUTH_SECRET is provided. Swallow that specific error so
    // server-rendered pages that call `getServerAuthSession` don't crash the
    // whole app. We still log a helpful message to the server logs so the
    // deploy owner can fix the configuration.
    //
    // Note: other unexpected errors should be re-thrown to avoid hiding real
    // problems.
    const e = err as any;
    if (e?.code === "NO_SECRET" || /secret/i.test(e?.message ?? "")) {
      console.error(
        "[next-auth] Missing NEXTAUTH_SECRET in production. Set NEXTAUTH_SECRET in Heroku (use `openssl rand -base64 32`) or your deployment provider.`",
      );
      return null;
    }

    throw err;
  }
}
