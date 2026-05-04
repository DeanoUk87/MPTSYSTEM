import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Serve uploaded files (runtime uploads not served by Next.js static file handler)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);

  // Security: ensure we don't escape the uploads directory
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!filePath.startsWith(uploadsDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const storedName = segments[segments.length - 1] ?? "";
    const ext = storedName.split(".").pop()?.toLowerCase() ?? "";

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
    };

    const contentType = mimeTypes[ext] ?? "application/octet-stream";

    // Look up the display filename from the database via the filePath
    // so downloads use the original filename (e.g. B23 5XX.pdf) not the stored name
    let displayName = storedName;
    try {
      const { prisma } = await import("@/lib/prisma");
      const record = await prisma.podFile.findFirst({
        where: { filePath: { endsWith: storedName }, deletedAt: null },
        select: { filename: true },
      });
      if (record?.filename) displayName = record.filename;
    } catch { /* fall back to storedName */ }

    // Use inline for display (images/PDFs in browser) unless ?download=1
    const forceDownload = new URL(req.url).searchParams.get("download") === "1";
    const disposition = forceDownload
      ? `attachment; filename="${displayName}"`
      : `inline; filename="${displayName}"`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "default-src 'self'",
      },
    });
  } catch {
    return new NextResponse("Error reading file", { status: 500 });
  }
}
