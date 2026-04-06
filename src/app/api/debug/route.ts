import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

export async function GET() {
  const cwd = process.cwd();
  const dbPath = path.resolve(cwd, "dev.db");
  const dbExists = fs.existsSync(dbPath);
  const dbSize = dbExists ? fs.statSync(dbPath).size : 0;

  let userCount = 0;
  let userRecord: any = null;
  let dbError = null;
  let bcryptResult = null;
  let bcryptError = null;

  try {
    const { prisma } = await import("@/lib/prisma");
    userCount = await prisma.user.count();

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
      // Mask password after test
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
    userCount,
    userRecord,
    bcryptResult,
    bcryptError,
    dbError,
    DATABASE_URL: process.env.DATABASE_URL ?? "(not set)",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "(set)" : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
