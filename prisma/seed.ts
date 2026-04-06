import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");

  const permissionNames = [
    "admin_roles_permissions",
    "customers_view", "customers_create", "customers_edit", "customers_delete", "customers_export", "customers_import",
    "sales_view", "sales_create", "sales_edit", "sales_delete", "sales_export", "sales_import",
    "invoices_view", "invoices_create", "invoices_edit", "invoices_delete", "invoices_export", "invoices_send",
    "settings_view", "settings_edit",
    "posts_view", "posts_create", "posts_edit", "posts_delete",
    "users_view", "users_create", "users_edit", "users_delete",
    "roles_view", "roles_create", "roles_edit", "roles_delete",
    "archive_view", "archive_restore",
    "composer_view", "composer_create", "composer_send",
  ];

  const permissions: Record<string, { id: string }> = {};
  for (const name of permissionNames) {
    const p = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    permissions[name] = p;
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" },
  });
  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: { name: "user" },
  });
  const admin2Role = await prisma.role.upsert({
    where: { name: "admin2" },
    update: {},
    create: { name: "admin2" },
  });

  for (const pName of permissionNames) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permissions[pName].id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permissions[pName].id },
    });
  }

  const userPerms = ["customers_view", "invoices_view", "sales_view"];
  for (const pName of userPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: permissions[pName].id } },
      update: {},
      create: { roleId: userRole.id, permissionId: permissions[pName].id },
    });
  }

  const admin2Perms = permissionNames.filter(
    (p) => !["settings_edit", "users_create", "users_delete", "roles_create", "roles_delete", "admin_roles_permissions"].includes(p)
  );
  for (const pName of admin2Perms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin2Role.id, permissionId: permissions[pName].id } },
      update: {},
      create: { roleId: admin2Role.id, permissionId: permissions[pName].id },
    });
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@mpbooking.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mpbooking.com",
      username: "admin",
      password: hashedPassword,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.settings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      companyName: "MP Transport Ltd",
      baseCurrency: "GBP",
      invoiceDueDate: 30,
      sendLimit: 50,
      messageTitle: "Your Invoice is Ready",
      defaultMessage2: "Please find attached your invoice {invoice_number}. Thank you for your business.",
    },
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@mpbooking.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
