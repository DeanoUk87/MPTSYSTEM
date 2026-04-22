import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cwd = process.cwd();
  const dbPath = path.resolve(cwd, "dev.db");
  const dbExists = fs.existsSync(dbPath);
  const dbSize = dbExists ? fs.statSync(dbPath).size : 0;
  const dbWritable = dbExists ? (() => { try { fs.accessSync(dbPath, fs.constants.W_OK); return true; } catch { return false; } })() : false;

  let userCount = 0;
  let userRecord: any = null;
  let dbError = null;
  let bcryptResult = null;
  let bcryptError = null;
  let writeTest: string | null = null;
  let settingsRow: any = null;
  let driverCount = 0;
  let customerCount = 0;

  let walMode: string | null = null;
  let bookingCount = 0;
  try {
    const { prisma } = await import("@/lib/prisma");
    userCount = await prisma.user.count();
    driverCount = await prisma.driver.count();
    customerCount = await prisma.customer.count();
    bookingCount = await prisma.booking.count();

    // Check WAL mode
    const walRows = await prisma.$queryRaw<{ journal_mode: string }[]>`PRAGMA journal_mode`;
    walMode = walRows[0]?.journal_mode ?? null;

    // Test write: update a timestamp on settings
    const rows = await prisma.$queryRaw<{ id: string; companyName: string | null; logo: string | null; menuLogo: string | null; bookingRefreshInterval: number | null }[]>`
      SELECT id, companyName, logo, menuLogo, bookingRefreshInterval FROM "settings" LIMIT 1
    `;
    settingsRow = rows[0] ?? null;
    if (settingsRow) {
      try {
        await prisma.$executeRawUnsafe(`UPDATE "settings" SET "companyName" = ? WHERE "id" = ?`, settingsRow.companyName ?? "MP Transport", settingsRow.id);
        writeTest = "OK";
      } catch (we: any) {
        writeTest = "FAILED: " + we.message;
      }
    } else {
      writeTest = "no settings row";
    }

    userRecord = await prisma.user.findFirst({
      where: { email: "admin@mpbooking.com" },
      select: { id: true, email: true, username: true, userStatus: true, password: true },
    });

    if (userRecord?.password) {
      try {
        bcryptResult = await bcrypt.compare("admin123", userRecord.password);
      } catch (e: any) {
        bcryptError = e.message;
      }
      userRecord.passwordHash = userRecord.password.substring(0, 10) + "...";
      delete userRecord.password;
    }
  } catch (e: any) {
    dbError = e.message;
  }

  return NextResponse.json({
    cwd,
    dbPath,
    dbExists,
    dbSize,
    dbWritable,
    walMode,
    writeTest,
    userCount,
    driverCount,
    customerCount,
    bookingCount,
    settingsRow,
    userRecord,
    bcryptResult,
    bcryptError,
    dbError,
    DATABASE_URL: process.env.DATABASE_URL ?? "(not set)",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "(set)" : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
