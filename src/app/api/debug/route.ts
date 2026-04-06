import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  const cwd = process.cwd();
  const dbPath = path.resolve(cwd, "dev.db");
  const dbExists = fs.existsSync(dbPath);
  const dbSize = dbExists ? fs.statSync(dbPath).size : 0;

  // Try to connect and count users
  let userCount = 0;
  let dbError = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    userCount = await prisma.user.count();
  } catch (e: any) {
    dbError = e.message;
  }

  return NextResponse.json({
    cwd,
    dbPath,
    dbExists,
    dbSize,
    userCount,
    dbError,
    DATABASE_URL: process.env.DATABASE_URL ?? "(not set)",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "(set)" : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
