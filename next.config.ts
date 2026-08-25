import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_READ_ONLY: process.env.VERCEL === "1" && !process.env.TURSO_DATABASE_URL ? "1" : "",
  },
  outputFileTracingIncludes: {
    "/**": ["./sqlite.db"],
  },
};

export default nextConfig;
