// Server code (server components, server actions, API routes) checks the
// real env vars directly — authoritative, no config needed. Client
// components can't see those vars, so they read the NEXT_PUBLIC_ mirror that
// next.config.ts sets from them at build time.
//
// Vercel's deployed filesystem is read-only outside /tmp (which is wiped on
// every cold start), so writes are only safe there once a durable database
// (Turso) is configured. If it isn't, we fall back to read-only rather than
// crash on every write or lose data silently.
export const isReadOnly =
  typeof window === "undefined"
    ? process.env.VERCEL === "1" && !process.env.TURSO_DATABASE_URL
    : process.env.NEXT_PUBLIC_READ_ONLY === "1";
