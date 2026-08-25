import { defineConfig } from "drizzle-kit";

const tursoUrl = process.env.TURSO_DATABASE_URL;

export default defineConfig(
  tursoUrl
    ? {
        schema: ["./db/schema.ts", "./db/auth-schema.ts"],
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url: tursoUrl,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        schema: ["./db/schema.ts", "./db/auth-schema.ts"],
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: "./sqlite.db",
        },
      }
);
