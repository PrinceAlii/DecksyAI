import { z } from "zod";

type Env = z.infer<typeof serverEnvSchema>;

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLASH_ROYALE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

let cachedEnv: Env | null = null;

export function getServerEnv(): Env {
  if (!cachedEnv) {
    const result = serverEnvSchema.safeParse({
      NODE_ENV: process.env.NODE_ENV,
      CLASH_ROYALE_API_KEY: process.env.CLASH_ROYALE_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      REDIS_URL: process.env.REDIS_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
    });

    if (!result.success) {
      // Surface useful error message in development but avoid crashing production
      const formatted = result.error.format();
      console.error("Invalid environment variables", formatted);
      throw new Error("Invalid environment variables. Check server logs for details.");
    }

    cachedEnv = result.data;
  }

  return cachedEnv;
}

export function isDevelopment(): boolean {
  return getServerEnv().NODE_ENV === "development";
}
