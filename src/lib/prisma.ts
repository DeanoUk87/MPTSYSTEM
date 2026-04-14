import { PrismaClient } from "../generated/prisma";

function createPrismaClient() {
  const client = new PrismaClient();
  // Enable WAL mode and set busy_timeout so concurrent Passenger workers
  // don't crash with SQLITE_BUSY / "database is locked" errors.
  client.$connect().then(async () => {
    await client.$executeRawUnsafe("PRAGMA journal_mode=WAL;");
    await client.$executeRawUnsafe("PRAGMA busy_timeout=10000;");
    await client.$executeRawUnsafe("PRAGMA synchronous=NORMAL;");
  }).catch((e) => console.error("[prisma] WAL setup error:", e));
  return client;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
