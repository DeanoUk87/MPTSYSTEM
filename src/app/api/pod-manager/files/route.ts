import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "pod");

async function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
}

// GET /api/pod-manager/files?folderId=&customerId=&search=&sort=name&dir=asc&page=1&pageSize=50
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || null;
  const customerId = searchParams.get("customerId") || undefined;
  const search = searchParams.get("search") || "";
  const sort = (searchParams.get("sort") || "name") as "name" | "createdAt" | "fileSize";
  const dir = (searchParams.get("dir") || "asc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)));

  // For customer portal sessions — check access is enabled
  if (session.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { podManagerAccess: true },
    });
    if (!customer?.podManagerAccess) {
      return NextResponse.json({ error: "POD Manager access not enabled for this account" }, { status: 403 });
    }
    // Files inside the folder tree may have customerId=null (created by admin).
    // Don't filter by customerId — the folder navigation already scopes access.
    // Just filter by the requested folderId.
    const where: any = {
      folderId: folderId ?? null,
      deletedAt: null,
      ...(search ? { filename: { contains: search } } : {}),
    };
    try {
      const [files, total] = await Promise.all([
        prisma.podFile.findMany({
          where,
          orderBy: { [sort]: dir },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { customer: { select: { id: true, name: true } } },
        }),
        prisma.podFile.count({ where }),
      ]);
      return NextResponse.json({ files, total, page, pageSize, pages: Math.ceil(total / pageSize) });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Admin / staff path
  const effectiveCustomerId = customerId || undefined;

  const where: any = {
    folderId: folderId ?? null,
    deletedAt: null,
    ...(effectiveCustomerId ? { customerId: effectiveCustomerId } : {}),
    ...(search ? { filename: { contains: search } } : {}),
  };

  try {
    const [files, total] = await Promise.all([
      prisma.podFile.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { customer: { select: { id: true, name: true } } },
      }),
      prisma.podFile.count({ where }),
    ]);

    return NextResponse.json({ files, total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/pod-manager/files — drag & drop upload
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canUpload = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_upload");
  if (!canUpload) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const formData = await req.formData();
  const folderId = (formData.get("folderId") as string) || null;
  const customerId = (formData.get("customerId") as string) || null;
  const files = formData.getAll("file") as File[];

  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "image/heic", "image/heif"];

  await ensureDir();
  const created = [];

  for (const file of files) {
    if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
    }
    if (file.size > 30 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 30 MB)" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const storedName = `pod-mgr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, storedName);
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

    const record = await prisma.podFile.create({
      data: {
        folderId: folderId || null,
        filename: file.name,
        storedName,
        filePath: `/api/uploads/pod/${storedName}`,
        mimeType: file.type,
        fileSize: file.size,
        customerId: customerId || null,
        uploadedById: session.id,
      },
    });
    created.push(record);
  }

  return NextResponse.json({ created });
}
