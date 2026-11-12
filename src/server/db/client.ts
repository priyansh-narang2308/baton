import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  // Serverless functions each hold their own pool, so keep it small there; the provider's pooler does the fan-in.
  const sql = postgres(url, { max: process.env.VERCEL ? 3 : 10, prepare: false });
  return drizzle(sql, { schema });
}

const globalForDb = globalThis as unknown as { batonDb?: Db };

/** Process-wide connection pool (survives Next.js dev hot reloads). */
export function db(): Db {
  if (!globalForDb.batonDb) {
    globalForDb.batonDb = createDb(process.env.DATABASE_URL ?? "postgres://baton@localhost:54329/baton");
  }
  return globalForDb.batonDb;
}
