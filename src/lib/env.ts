import { z } from "zod";

type Env = z.infer<typeof serverEnvSchema>;

const ACCOUNT_EXPORT_KEY_BYTES = 32;

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLASH_ROYALE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  INTERNAL_API_TOKEN: z.string().optional(),
  FEEDBACK_USER_AGENT_BLOCKLIST: z.string().optional(),
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
  ACCOUNT_EXPORT_DIR: z.string().optional(),
  ACCOUNT_EXPORT_ENCRYPTION_KEY: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      try {
        const decoded = Buffer.from(value, "base64");
        return decoded.length === ACCOUNT_EXPORT_KEY_BYTES;
      } catch (error) {
        console.error("Failed to decode ACCOUNT_EXPORT_ENCRYPTION_KEY", error);
        return false;
      }
    }, "ACCOUNT_EXPORT_ENCRYPTION_KEY must be a base64-encoded 32 byte key."),
  ACCOUNT_EXPORT_KEY_ID: z.string().optional(),
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
      INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN,
      FEEDBACK_USER_AGENT_BLOCKLIST: process.env.FEEDBACK_USER_AGENT_BLOCKLIST,
      REDIS_TLS_ALLOW_SELF_SIGNED: process.env.REDIS_TLS_ALLOW_SELF_SIGNED,
      REDIS_ALLOW_INSECURE_TLS: process.env.REDIS_ALLOW_INSECURE_TLS,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      // Ensure NEXTAUTH_URL is an absolute URL. If it's not provided, attempt to
      // infer a sensible default for local development. This prevents runtime
      // errors from APIs that call `new URL(..., NEXTAUTH_URL)` when the
      // environment variable was set to a bare host like "localhost:3000"
      // or omitted entirely.
      NEXTAUTH_URL: (() => {
        const raw = process.env.NEXTAUTH_URL?.trim();
        if (raw && raw.length > 0) return raw;
        if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
        if ((process.env.NODE_ENV ?? "development") === "development") return "http://localhost:3000";
        return undefined;
      })(),
      AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
      AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
      ACCOUNT_EXPORT_DIR: process.env.ACCOUNT_EXPORT_DIR,
    });

    if (!result.success) {
      // Surface useful error message in development but avoid crashing production
      const formatted = result.error.format();
      console.error("Invalid environment variables", formatted);
      throw new Error("Invalid environment variables. Check server logs for details.");
    }

    const data = result.data;

    // Skip strict validation during build time (when NEXT_PHASE is set)
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

    if (data.NODE_ENV === "production" && !isBuildTime) {
      if (!data.NEXTAUTH_SECRET?.trim()) {
        throw new Error(
          "NEXTAUTH_SECRET is required in production. Generate a strong secret and set it before starting the server.",
        );
      }

      if (!data.ACCOUNT_EXPORT_ENCRYPTION_KEY?.trim()) {
        throw new Error(
          "ACCOUNT_EXPORT_ENCRYPTION_KEY is required in production to encrypt account export bundles.",
        );
      }
    }

    if (data.NODE_ENV !== "development" && !isBuildTime) {
      if (data.REDIS_TLS_ALLOW_SELF_SIGNED || data.REDIS_ALLOW_INSECURE_TLS) {
        throw new Error(
          "Insecure Redis TLS flags are only permitted during local development. Remove REDIS_TLS_ALLOW_SELF_SIGNED/REDIS_ALLOW_INSECURE_TLS before deploying.",
        );
      }
    }

    cachedEnv = data;
  }

  return cachedEnv;
}

export function isDevelopment(): boolean {
  return getServerEnv().NODE_ENV === "development";
}
