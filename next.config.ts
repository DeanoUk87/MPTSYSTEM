import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@react-pdf/renderer"],
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production",
    // Google Maps — NEXT_PUBLIC_ makes it available in the browser bundle
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? "AIzaSyCxhsy1iGT_Aj5JnnyQMLOUVijsLm84Vd4",
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? "AIzaSyCxhsy1iGT_Aj5JnnyQMLOUVijsLm84Vd4",
    GOOGLE_KML: process.env.GOOGLE_KML ?? "https://portal.mp-transport.co.uk/ULEZone2.kml",
    // Crafty Clicks postcode lookup
    CRAFTY_CLICKS_API_KEY: process.env.CRAFTY_CLICKS_API_KEY ?? "b6156-93a8a-c5122-0314a",
    // GPS Live unit tracking
    GPSLIVE_USE_MOCK: process.env.GPSLIVE_USE_MOCK ?? "false",
    LIVE_DEVICE_API: process.env.LIVE_DEVICE_API ?? "7c17f4294f50de688caae05cfa31be50ceeb8dceab71f65ab7399fd17887451b",
  },
};

export default nextConfig;
