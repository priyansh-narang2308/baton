import { z } from "zod";

// Nexconn global data centers → Server API domains (docs: platform-chat-api/prepare-to-use-api/base-url)
const API_DOMAINS = {
  SG: ["api.sg-light-api.com", "api-b.sg-light-api.com"],
  NA: ["api.us-light-api.com", "api-b.us-light-api.com"],
  SA: ["api.sau-light-api.com", "api-b.sau-light-api.com"],
} as const;

// Blank values in .env files (e.g. `NEXCONN_APP_KEY=`) count as unset.
const optional = <T extends z.ZodType>(t: T) => z.preprocess((v) => (v === "" ? undefined : v), t.optional());

const schema = z.object({
  DATABASE_URL: z.string().url().default("postgres://baton@localhost:54329/baton"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NEXCONN_APP_KEY: optional(z.string().min(1)),
  NEXCONN_APP_SECRET: optional(z.string().min(1)),
  NEXCONN_DATA_CENTER: z.enum(["SG", "NA", "SA"]).default("SG"),
  PUBLIC_BASE_URL: optional(z.string().url()),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Invalid server configuration — ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export type NexconnConfig = { appKey: string; appSecret: string; domains: readonly string[]; dataCenter: Env["NEXCONN_DATA_CENTER"] };

/** Returns Nexconn credentials, or null when they are not configured (the app shows a setup banner instead of failing silently). */
export function nexconnConfig(): NexconnConfig | null {
  const e = env();
  if (!e.NEXCONN_APP_KEY || !e.NEXCONN_APP_SECRET) return null;
  return { appKey: e.NEXCONN_APP_KEY, appSecret: e.NEXCONN_APP_SECRET, domains: API_DOMAINS[e.NEXCONN_DATA_CENTER], dataCenter: e.NEXCONN_DATA_CENTER };
}
