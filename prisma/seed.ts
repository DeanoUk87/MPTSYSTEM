import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const permissionNames = [
    // Dashboard
    "dashboard_view",
    // Bookings
    "bookings_view", "bookings_create", "bookings_edit", "bookings_delete",
    // Drivers
    "drivers_view", "drivers_create", "drivers_edit", "drivers_delete",
    // Vehicles
    "vehicles_view", "vehicles_create", "vehicles_edit", "vehicles_delete",
    // Storage
    "storage_view", "storage_create", "storage_edit", "storage_delete",
    // Customers
    "customers_view", "customers_create", "customers_edit", "customers_delete",
    // Addresses
    "addresses_view", "addresses_create", "addresses_edit", "addresses_delete",
    // Fuel Surcharges
    "fuel_view", "fuel_create", "fuel_edit", "fuel_delete",
    // Map Routing
    "map_view",
    // Settings
    "settings_view", "settings_edit",
    // Users
    "users_view", "users_create", "users_edit", "users_delete",
    // Roles
    "roles_view", "roles_create", "roles_edit", "roles_delete",
    // Driver Portal
    "driver_jobs_view",
    // Legacy Records
    "legacy_view",
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
  const driverRole = await prisma.role.upsert({
    where: { name: "driver" },
    update: {},
    create: { name: "driver" },
  });

  for (const pName of permissionNames) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permissions[pName].id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permissions[pName].id },
    });
  }

  const userPerms = ["dashboard_view", "bookings_view", "customers_view"];
  for (const pName of userPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: permissions[pName].id } },
      update: {},
      create: { roleId: userRole.id, permissionId: permissions[pName].id },
    });
  }

  const admin2Perms = permissionNames.filter(
    (p) => !["settings_edit", "users_create", "users_delete", "roles_create", "roles_delete"].includes(p)
  );
  for (const pName of admin2Perms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin2Role.id, permissionId: permissions[pName].id } },
      update: {},
      create: { roleId: admin2Role.id, permissionId: permissions[pName].id },
    });
  }

  // Driver role gets only driver_jobs_view
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: driverRole.id, permissionId: permissions["driver_jobs_view"].id } },
    update: {},
    create: { roleId: driverRole.id, permissionId: permissions["driver_jobs_view"].id },
  });

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

  // Ensure default booking types exist
  for (const name of ["Quote", "Sameday", "Overnight", "Economy"]) {
    await prisma.bookingType.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@mpbooking.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
