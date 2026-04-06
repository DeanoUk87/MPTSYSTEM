import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  // Try DATABASE_URL env first, then fall back to dev.db relative to project root
  const dbUrl = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`;
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
