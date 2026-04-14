import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required (used on login page and sidebar)
export async function GET() {
  const settings = await prisma.settings.findFirst({
    select: { companyName: true, logo: true, menuLogo: true },
  });
  return NextResponse.json({
    companyName: settings?.companyName || "MP Transport",
    logo: settings?.logo || null,
    menuLogo: settings?.menuLogo || null,
  });
}
