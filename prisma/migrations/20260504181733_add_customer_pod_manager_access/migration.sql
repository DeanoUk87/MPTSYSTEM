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
    "jobRefStart" INTEGER NOT NULL DEFAULT 1,
    "customerAccount" TEXT,
    "customerEmailBcc" TEXT,
    "termsOfPayment" TEXT,
    "messageType" TEXT,
    "userId" TEXT,
    "podManagerAccess" BOOLEAN NOT NULL DEFAULT false,
    "legacyCustomerId" INTEGER
);
INSERT INTO "new_customers" ("accountNumber", "address", "address2", "address3", "city", "contact", "customerAccount", "customerEmailBcc", "deadMileage", "email", "id", "jobRefStart", "legacyCustomerId", "messageType", "name", "notes", "phone", "poEmail", "poNumber", "postcode", "termsOfPayment", "userId") SELECT "accountNumber", "address", "address2", "address3", "city", "contact", "customerAccount", "customerEmailBcc", "deadMileage", "email", "id", "jobRefStart", "legacyCustomerId", "messageType", "name", "notes", "phone", "poEmail", "poNumber", "postcode", "termsOfPayment", "userId" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_accountNumber_key" ON "customers"("accountNumber");
CREATE UNIQUE INDEX "customers_customerAccount_key" ON "customers"("customerAccount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
