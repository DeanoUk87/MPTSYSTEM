import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production",
    DATABASE_URL: process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`,
  },
};

export default nextConfig;
