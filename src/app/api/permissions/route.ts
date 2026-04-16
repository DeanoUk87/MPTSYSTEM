import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Canonical list of all permissions in the system
const ALL_PERMISSIONS = [
  "dashboard_view",
  "bookings_view", "bookings_create", "bookings_edit", "bookings_delete",
  "drivers_view", "drivers_create", "drivers_edit", "drivers_delete",
  "vehicles_view", "vehicles_create", "vehicles_edit", "vehicles_delete",
  "storage_view", "storage_create", "storage_edit", "storage_delete",
  "customers_view", "customers_create", "customers_edit", "customers_delete",
  "addresses_view", "addresses_create", "addresses_edit", "addresses_delete",
  "fuel_view", "fuel_create", "fuel_edit", "fuel_delete",
  "map_view",
  "settings_view", "settings_edit",
  "users_view", "users_create", "users_edit", "users_delete",
  "roles_view", "roles_create", "roles_edit", "roles_delete",
  "driver_jobs_view",
];

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-sync: ensure all canonical permissions exist in DB
  const existing = await prisma.permission.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map(p => p.name));
  const missing = ALL_PERMISSIONS.filter(n => !existingNames.has(n));
  if (missing.length > 0) {
    await Promise.all(missing.map(name =>
      prisma.permission.upsert({ where: { name }, update: {}, create: { name } })
    ));
    // Auto-assign new permissions to admin role
    const adminRole = await prisma.role.findFirst({ where: { name: "admin" } });
    if (adminRole) {
      const newPerms = await prisma.permission.findMany({ where: { name: { in: missing } } });
      await Promise.all(newPerms.map(p =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: adminRole.id, permissionId: p.id },
        })
      ));
    }
  }

  // Return only canonical permissions (hide old/stale ones)
  const permissions = await prisma.permission.findMany({
    where: { name: { in: ALL_PERMISSIONS } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(permissions);
}
