import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  const sql = postgres(url, { max: 10, prepare: false });
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
