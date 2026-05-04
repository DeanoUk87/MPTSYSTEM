import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"],
  env: {
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com",
              "connect-src 'self' https://maps.googleapis.com https://api.postcodes.io https://api.craftyclick.co.uk",
              "frame-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
