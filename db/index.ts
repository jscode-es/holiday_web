import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import * as schema from "./schema";

// When TURSO_DATABASE_URL is set, data lives in Turso — a hosted libSQL
// database — so writes persist across Vercel cold starts instead of hitting
// the read-only deployment filesystem. Without it, we fall back to the local
// sqlite.db file via better-sqlite3. Both drivers expose the same drizzle
// SQLite query builder; the sync driver's .get()/.run()/.all() return plain
// values, the async one returns Promises, so every call site awaits them and
// works unchanged against either.
function createDb() {
  if (process.env.TURSO_DATABASE_URL) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzleLibsql(client, { schema });
  }
  const sqlite = new Database("sqlite.db");
  sqlite.pragma("foreign_keys = ON");
  return drizzleSqlite(sqlite, { schema });
}

export const db = createDb();
