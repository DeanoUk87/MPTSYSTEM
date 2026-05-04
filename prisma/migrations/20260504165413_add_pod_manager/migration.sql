/*
  Warnings:

  - You are about to drop the column `temperature` on the `storage_units` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "pod_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "customerId" TEXT,
    "createdById" TEXT,
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "pod_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "pod_folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pod_folders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pod_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folderId" TEXT,
    "bookingId" TEXT,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "customerId" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "pod_files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "pod_folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pod_files_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pod_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "roleId" TEXT,
    "customerId" TEXT,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canMove" BOOLEAN NOT NULL DEFAULT false,
    "canRename" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
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
    "jobRef" TEXT,
    "deletedAt" DATETIME,
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
    CONSTRAINT "bookings_driverContactId_fkey" FOREIGN KEY ("driverContactId") REFERENCES "driver_contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_chillUnitId_fkey" FOREIGN KEY ("chillUnitId") REFERENCES "storage_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_ambientUnitId_fkey" FOREIGN KEY ("ambientUnitId") REFERENCES "storage_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("ambientUnitId", "avoidTolls", "bookedBy", "bookingTypeId", "chillUnitId", "collectionAddress1", "collectionAddress2", "collectionArea", "collectionContact", "collectionCountry", "collectionDate", "collectionName", "collectionNotes", "collectionPhone", "collectionPostcode", "collectionTime", "cost", "createdAt", "createdById", "customerId", "customerPrice", "cxDriverCost", "cxDriverId", "deadMileageStatus", "deletedAt", "deliveredTemperature", "deliveryAddress1", "deliveryAddress2", "deliveryArea", "deliveryContact", "deliveryCountry", "deliveryDate", "deliveryLat", "deliveryLng", "deliveryName", "deliveryNotes", "deliveryPhone", "deliveryPostcode", "deliveryTime", "driverConfirmCollectionAt", "driverContactId", "driverCost", "driverId", "driverNote", "extraCost", "extraCost2", "extraCost2Label", "fuelSurchargeCost", "fuelSurchargePercent", "hideTrackingMap", "hideTrackingTemperature", "id", "jobNotes", "jobRef", "jobStatus", "locker", "manualAmount", "manualDesc", "miles", "numberOfItems", "officeNotes", "podDataVerify", "podDate", "podMobile", "podRelationship", "podSignature", "podTime", "podUpload", "purchaseOrder", "secondManId", "updatedAt", "updatedById", "vehicleId", "waitAndReturn", "weekend", "weight") SELECT "ambientUnitId", "avoidTolls", "bookedBy", "bookingTypeId", "chillUnitId", "collectionAddress1", "collectionAddress2", "collectionArea", "collectionContact", "collectionCountry", "collectionDate", "collectionName", "collectionNotes", "collectionPhone", "collectionPostcode", "collectionTime", "cost", "createdAt", "createdById", "customerId", "customerPrice", "cxDriverCost", "cxDriverId", "deadMileageStatus", "deletedAt", "deliveredTemperature", "deliveryAddress1", "deliveryAddress2", "deliveryArea", "deliveryContact", "deliveryCountry", "deliveryDate", "deliveryLat", "deliveryLng", "deliveryName", "deliveryNotes", "deliveryPhone", "deliveryPostcode", "deliveryTime", "driverConfirmCollectionAt", "driverContactId", "driverCost", "driverId", "driverNote", "extraCost", "extraCost2", "extraCost2Label", "fuelSurchargeCost", "fuelSurchargePercent", "hideTrackingMap", "hideTrackingTemperature", "id", "jobNotes", "jobRef", "jobStatus", "locker", "manualAmount", "manualDesc", "miles", "numberOfItems", "officeNotes", "podDataVerify", "podDate", "podMobile", "podRelationship", "podSignature", "podTime", "podUpload", "purchaseOrder", "secondManId", "updatedAt", "updatedById", "vehicleId", "waitAndReturn", "weekend", "weight" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE TABLE "new_storage_units" (
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
INSERT INTO "new_storage_units" ("availability", "calibrationDate", "createdAt", "currentDriverId", "id", "imei", "jobId", "trackable", "unitNumber", "unitSize", "unitType", "updatedAt") SELECT "availability", "calibrationDate", "createdAt", "currentDriverId", "id", "imei", "jobId", "trackable", "unitNumber", "unitSize", "unitType", "updatedAt" FROM "storage_units";
DROP TABLE "storage_units";
ALTER TABLE "new_storage_units" RENAME TO "storage_units";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
