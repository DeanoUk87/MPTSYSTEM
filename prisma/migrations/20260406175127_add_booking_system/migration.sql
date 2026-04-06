/*
  Warnings:

  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `customerEmail` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `customers` table. All the data in the column will be lost.
  - Added the required column `name` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "customerId" TEXT;
ALTER TABLE "users" ADD COLUMN "dcontactId" TEXT;
ALTER TABLE "users" ADD COLUMN "driverId" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "posts";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "driverType" TEXT NOT NULL DEFAULT 'Driver',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "costPerMile" REAL NOT NULL DEFAULT 0,
    "costPerMileWeekends" REAL NOT NULL DEFAULT 0,
    "costPerMileOutOfHours" REAL NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "driver_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "vehicleMake" TEXT,
    "vehicleRegistration" TEXT,
    "driverPhone" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "driver_contacts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costPerMile" REAL NOT NULL DEFAULT 0,
    "userId" TEXT,
    "driverId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customer_vehicle_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "ratePerMile" REAL NOT NULL DEFAULT 0,
    "ratePerMileWeekends" REAL NOT NULL DEFAULT 0,
    "ratePerMileOutOfHours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_vehicle_rates_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_vehicle_rates_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storage_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitNumber" TEXT NOT NULL,
    "imei" TEXT,
    "unitSize" TEXT,
    "unitType" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'Yes',
    "currentDriverId" TEXT,
    "calibrationDate" TEXT,
    "jobId" TEXT,
    "trackable" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "storage_units_currentDriverId_fkey" FOREIGN KEY ("currentDriverId") REFERENCES "drivers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storage_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "storage_usage_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "storage_units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "booking_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fuel_surcharges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL NOT NULL,
    "percentage" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "purchaseOrder" TEXT,
    "bookedBy" TEXT,
    "bookingTypeId" TEXT,
    "jobNotes" TEXT,
    "officeNotes" TEXT,
    "collectionDate" TEXT,
    "collectionTime" TEXT DEFAULT '00:00',
    "collectionName" TEXT,
    "collectionAddress1" TEXT,
    "collectionAddress2" TEXT,
    "collectionArea" TEXT,
    "collectionCountry" TEXT DEFAULT 'UK',
    "collectionPostcode" TEXT,
    "collectionContact" TEXT,
    "collectionPhone" TEXT,
    "collectionNotes" TEXT,
    "deliveryDate" TEXT,
    "deliveryTime" TEXT,
    "deliveryName" TEXT,
    "deliveryAddress1" TEXT,
    "deliveryAddress2" TEXT,
    "deliveryArea" TEXT,
    "deliveryCountry" TEXT DEFAULT 'UK',
    "deliveryPostcode" TEXT,
    "deliveryContact" TEXT,
    "deliveryPhone" TEXT,
    "deliveryNotes" TEXT,
    "deliveryLat" REAL,
    "deliveryLng" REAL,
    "vehicleId" TEXT,
    "miles" REAL,
    "customerPrice" REAL,
    "cost" REAL,
    "manualAmount" REAL,
    "manualDesc" TEXT,
    "extraCost2" REAL,
    "extraCost2Label" TEXT,
    "fuelSurchargePercent" REAL,
    "fuelSurchargeCost" REAL,
    "weekend" INTEGER NOT NULL DEFAULT 0,
    "avoidTolls" BOOLEAN NOT NULL DEFAULT false,
    "driverId" TEXT,
    "driverCost" REAL,
    "driverContactId" TEXT,
    "secondManId" TEXT,
    "extraCost" REAL,
    "cxDriverId" TEXT,
    "cxDriverCost" REAL,
    "chillUnitId" TEXT,
    "ambientUnitId" TEXT,
    "deliveredTemperature" TEXT,
    "hideTrackingTemperature" BOOLEAN NOT NULL DEFAULT false,
    "hideTrackingMap" BOOLEAN NOT NULL DEFAULT false,
    "numberOfItems" INTEGER,
    "weight" REAL,
    "podSignature" TEXT,
    "podTime" TEXT,
    "podDate" TEXT,
    "podUpload" TEXT,
    "podMobile" BOOLEAN NOT NULL DEFAULT false,
    "podDataVerify" BOOLEAN NOT NULL DEFAULT false,
    "podRelationship" TEXT,
    "driverNote" TEXT,
    "driverConfirmCollectionAt" DATETIME,
    "jobStatus" INTEGER NOT NULL DEFAULT 0,
    "locker" INTEGER NOT NULL DEFAULT 0,
    "deadMileageStatus" TEXT,
    "waitAndReturn" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "booking_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_secondManId_fkey" FOREIGN KEY ("secondManId") REFERENCES "drivers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_cxDriverId_fkey" FOREIGN KEY ("cxDriverId") REFERENCES "drivers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_chillUnitId_fkey" FOREIGN KEY ("chillUnitId") REFERENCES "storage_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_ambientUnitId_fkey" FOREIGN KEY ("ambientUnitId") REFERENCES "storage_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "via_addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT,
    "viaType" TEXT NOT NULL DEFAULT 'Via',
    "name" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "area" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "phone" TEXT,
    "contact" TEXT,
    "notes" TEXT,
    "viaDate" TEXT,
    "viaTime" TEXT,
    "signedBy" TEXT,
    "podDate" TEXT,
    "podTime" TEXT,
    "podRelationship" TEXT,
    "deliveredTemp" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "viaPodVerify" BOOLEAN NOT NULL DEFAULT false,
    "viaPodMobile" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "via_addresses_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "geo_tracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT,
    "currentLat" REAL,
    "currentLng" REAL,
    "currentDate" DATETIME,
    "status" INTEGER NOT NULL DEFAULT 1,
    "speed" REAL,
    "startedLat" REAL,
    "startedLng" REAL,
    "endedLat" REAL,
    "endedLng" REAL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "geo_tracking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "address2" TEXT,
    "address3" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "notes" TEXT,
    "contact" TEXT,
    "poNumber" TEXT,
    "poEmail" TEXT,
    "deadMileage" INTEGER NOT NULL DEFAULT 0,
    "customerAccount" TEXT,
    "customerEmailBcc" TEXT,
    "termsOfPayment" TEXT,
    "messageType" TEXT,
    "userId" TEXT
);
INSERT INTO "new_customers" ("customerAccount", "customerEmailBcc", "id", "messageType", "poNumber", "termsOfPayment", "userId") SELECT "customerAccount", "customerEmailBcc", "id", "messageType", "poNumber", "termsOfPayment", "userId" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_accountNumber_key" ON "customers"("accountNumber");
CREATE UNIQUE INDEX "customers_customerAccount_key" ON "customers"("customerAccount");
CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "companyAddress1" TEXT,
    "companyAddress2" TEXT,
    "state" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "cemail" TEXT,
    "website" TEXT,
    "primaryContact" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "vatNumber" TEXT,
    "vatPercent" REAL NOT NULL DEFAULT 20,
    "invoiceDueDate" INTEGER NOT NULL DEFAULT 30,
    "invoiceDuePaymentBy" TEXT,
    "messageTitle" TEXT,
    "defaultMessage" TEXT,
    "defaultMessage2" TEXT,
    "sendLimit" INTEGER NOT NULL DEFAULT 50
);
INSERT INTO "new_settings" ("baseCurrency", "cemail", "city", "companyAddress1", "companyAddress2", "companyName", "country", "defaultMessage", "defaultMessage2", "fax", "id", "invoiceDueDate", "invoiceDuePaymentBy", "logo", "messageTitle", "phone", "postcode", "primaryContact", "sendLimit", "state", "vatNumber", "website") SELECT "baseCurrency", "cemail", "city", "companyAddress1", "companyAddress2", "companyName", "country", "defaultMessage", "defaultMessage2", "fax", "id", "invoiceDueDate", "invoiceDuePaymentBy", "logo", "messageTitle", "phone", "postcode", "primaryContact", "sendLimit", "state", "vatNumber", "website" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "customer_vehicle_rates_customerId_vehicleId_key" ON "customer_vehicle_rates"("customerId", "vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_types_name_key" ON "booking_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "geo_tracking_bookingId_key" ON "geo_tracking"("bookingId");
