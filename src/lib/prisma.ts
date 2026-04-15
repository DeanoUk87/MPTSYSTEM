import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaWalReady: boolean;
};

function createPrisma() {
  const client = new PrismaClient();
  // Enable WAL mode for SQLite so concurrent Passenger workers can read during writes.
  // We run this only once per process. If the DB is already in WAL mode (another worker
  // already set it), PRAGMA journal_mode = WAL is a no-op and returns 'wal' immediately.
  if (!globalForPrisma.prismaWalReady) {
    globalForPrisma.prismaWalReady = true;
    client.$executeRawUnsafe("PRAGMA journal_mode = WAL;")
      .then(() => client.$executeRawUnsafe("PRAGMA synchronous = NORMAL;"))
      .catch(() => {
        // SQLITE_BUSY during WAL transition is non-fatal; another worker already set it.
        globalForPrisma.prismaWalReady = false; // allow retry on next request
      });
  }
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

globalForPrisma.prisma = prisma;

