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
  // When true, allow connecting to Redis TLS endpoints with self-signed
  // certificates by setting `tls.rejectUnauthorized = false` in the client.
  // This weakens TLS verification and should only be used when necessary.
  REDIS_TLS_ALLOW_SELF_SIGNED: z.preprocess(
    (val) => {
      if (val === "true" || val === true) return true;
      return false;
    },
    z.boolean().optional()
  ),
  // Alternate env var name for teams that prefer a different naming
  // convention. We will accept either one.
  REDIS_ALLOW_INSECURE_TLS: z.preprocess(
    (val) => {
      if (val === "true" || val === true) return true;
      return false;
    },
    z.boolean().optional()
  ),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

let cachedEnv: Env | null = null;

export function getServerEnv(): Env {
  if (!cachedEnv) {
    // Prefer common Heroku-style environment variables when the primary
    // variables are missing. For DATABASE_URL we search for any
    // HEROKU_POSTGRESQL_*_URL; for Redis we accept REDIS_TLS_URL as a
    // potential provider-supplied variable.
    const herokuDb = Object.keys(process.env).find((k) => /^HEROKU_POSTGRESQL_.*_URL$/i.test(k));
    const herokuDbUrl = herokuDb ? process.env[herokuDb] : undefined;
    const herokuRedis = process.env.REDIS_TLS_URL || process.env.REDIS_PROVIDER_URL;

    const result = serverEnvSchema.safeParse({
      NODE_ENV: process.env.NODE_ENV,
      CLASH_ROYALE_API_KEY: process.env.CLASH_ROYALE_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      DATABASE_URL: process.env.DATABASE_URL || herokuDbUrl,
      DIRECT_URL: process.env.DIRECT_URL,
      REDIS_URL: process.env.REDIS_URL || herokuRedis,
      REDIS_TLS_ALLOW_SELF_SIGNED: process.env.REDIS_TLS_ALLOW_SELF_SIGNED,
      REDIS_ALLOW_INSECURE_TLS: process.env.REDIS_ALLOW_INSECURE_TLS,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
      AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
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
