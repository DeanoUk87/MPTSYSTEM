import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  walInitialised: boolean;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
globalForPrisma.prisma = prisma;

// Set WAL mode once per process. Prisma's single SQLite connection
// serialises these behind real queries — no race condition.
if (!globalForPrisma.walInitialised) {
  globalForPrisma.walInitialised = true;
  prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
}

