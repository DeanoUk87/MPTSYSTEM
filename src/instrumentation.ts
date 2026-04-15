export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { prisma } = await import("./lib/prisma");
      // Pre-warm the DB connection and ensure WAL mode before the first request.
      // PRAGMAs that return rows must use $queryRawUnsafe, not $executeRawUnsafe.
      await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
      await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      // Log but never crash the process — Passenger will handle retries
      console.error("[instrumentation] DB pre-warm failed:", e);
    }
  }
}
