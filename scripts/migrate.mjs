// Applies SQL migrations in ./drizzle to DATABASE_URL (defaults to the project-local dev database).
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Hosted Postgres behind a pooler (Neon on Vercel) also exposes a direct URL; DDL is safer on a direct connection.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "postgres://baton@localhost:54329/baton";
const sql = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(sql), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
await sql.end();
console.log(`Migrations applied to ${url.replace(/:[^:@/]+@/, ":***@")}`);
