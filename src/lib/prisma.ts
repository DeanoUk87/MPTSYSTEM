import { PrismaClient } from "../generated/prisma";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  // Strip the "file:" prefix for better-sqlite3
  const dbPath = dbUrl.replace(/^file:/, "");
  const db = new Database(dbPath);
  const adapter = new PrismaBetterSQLite3(db);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
