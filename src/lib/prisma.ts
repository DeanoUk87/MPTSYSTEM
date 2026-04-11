import { PrismaClient } from "../generated/prisma";

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
