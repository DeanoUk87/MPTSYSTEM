import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "MP Driver App",
  description: "Driver job management",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MP Driver" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a14",
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {children}
    </div>
  );
}
