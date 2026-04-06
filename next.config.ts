import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production",
  },
};

export default nextConfig;
