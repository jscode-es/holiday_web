import Database from "better-sqlite3";
import { execSync } from "node:child_process";

const sqlite = new Database("sqlite.db");
const hasDaysTable = sqlite
  .prepare("select name from sqlite_master where type='table' and name='days'")
  .get();
sqlite.close();

if (!hasDaysTable) {
  console.log("No schema found in sqlite.db — pushing schema (empty database, ready to import)...");
  execSync("npx drizzle-kit push --force", { stdio: "inherit" });
} else {
  console.log("Existing database detected — skipping schema push.");
}
