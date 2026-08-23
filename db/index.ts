import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { isReadOnly } from "@/lib/env";

// On Vercel the deployed function's filesystem is read-only except /tmp,
// and /tmp is wiped on every cold start. We copy the schema-only db that
// was built into the deployment there once per instance, so reads work and
// an import can write into it for as long as that instance stays warm.
function resolveDbPath() {
  if (!isReadOnly) return "sqlite.db";

  const tmpPath = "/tmp/sqlite.db";
  if (!existsSync(tmpPath)) {
    const bundled = path.join(process.cwd(), "sqlite.db");
    if (existsSync(bundled)) copyFileSync(bundled, tmpPath);
  }
  return tmpPath;
}

const sqlite = new Database(resolveDbPath());
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
