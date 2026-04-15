export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prisma } = await import("./lib/prisma");
    // Pre-warm the DB connection and ensure WAL mode before the first request
    await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
    await prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL;");
    await prisma.$queryRaw`SELECT 1`;
  }
}
