-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "password" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "emailVerifiedAt" DATETIME,
    "userStatus" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "route" TEXT,
    "guardName" TEXT NOT NULL DEFAULT 'web',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerAccount" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerEmailBcc" TEXT,
    "customerPhone" TEXT,
    "termsOfPayment" TEXT,
    "messageType" TEXT,
    "poNumber" TEXT,
    "userId" TEXT
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TEXT NOT NULL,
    "customerAccount" TEXT NOT NULL,
    "customerName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "town" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "customerAccount2" TEXT,
    "items" TEXT,
    "weight" TEXT,
    "invoiceTotal" TEXT,
    "jobNumber" TEXT,
    "jobDate" TEXT,
    "sendingDepot" TEXT,
    "deliveryDepot" TEXT,
    "destination" TEXT,
    "town2" TEXT,
    "postcode2" TEXT,
    "serviceType" TEXT,
    "items2" TEXT,
    "volumeWeight" TEXT,
    "increasedLiabilityCover" TEXT,
    "subTotal" TEXT,
    "senderReference" TEXT,
    "sendersPostcode" TEXT,
    "vatAmount" TEXT,
    "vatPercent" TEXT,
    "percentageFuelSurcharge" TEXT,
    "percentageResourcingSurcharge" TEXT,
    "uploadCode" TEXT,
    "uploadTs" TEXT,
    "msCreated" INTEGER NOT NULL DEFAULT 0,
    "invoiceReady" INTEGER NOT NULL DEFAULT 0,
    "numb1" TEXT,
    "numb2" TEXT,
    "numb3" TEXT,
    "numb4" TEXT,
    "numb5" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_customerAccount_fkey" FOREIGN KEY ("customerAccount") REFERENCES "customers" ("customerAccount") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT,
    "customerAccount" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TEXT NOT NULL,
    "dueDate" TEXT,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terms" TEXT,
    "printer" INTEGER NOT NULL DEFAULT 0,
    "poNumber" TEXT,
    "batchNo" TEXT,
    "emailStatus" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "invoices_customerAccount_fkey" FOREIGN KEY ("customerAccount") REFERENCES "customers" ("customerAccount") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales_archive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TEXT NOT NULL,
    "customerAccount" TEXT NOT NULL,
    "customerName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "town" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "customerAccount2" TEXT,
    "items" TEXT,
    "weight" TEXT,
    "invoiceTotal" TEXT,
    "jobNumber" TEXT,
    "jobDate" TEXT,
    "sendingDepot" TEXT,
    "deliveryDepot" TEXT,
    "destination" TEXT,
    "town2" TEXT,
    "postcode2" TEXT,
    "serviceType" TEXT,
    "items2" TEXT,
    "volumeWeight" TEXT,
    "increasedLiabilityCover" TEXT,
    "subTotal" TEXT,
    "senderReference" TEXT,
    "sendersPostcode" TEXT,
    "vatAmount" TEXT,
    "vatPercent" TEXT,
    "percentageFuelSurcharge" TEXT,
    "percentageResourcingSurcharge" TEXT,
    "uploadCode" TEXT,
    "uploadTs" TEXT,
    "msCreated" INTEGER NOT NULL DEFAULT 0,
    "invoiceReady" INTEGER NOT NULL DEFAULT 0,
    "numb1" TEXT,
    "numb2" TEXT,
    "numb3" TEXT,
    "numb4" TEXT,
    "numb5" TEXT,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "invoices_archive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT,
    "customerAccount" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TEXT NOT NULL,
    "dueDate" TEXT,
    "terms" TEXT,
    "printer" INTEGER NOT NULL DEFAULT 0,
    "poNumber" TEXT,
    "emailStatus" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "settings" (
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
    "invoiceDueDate" INTEGER NOT NULL DEFAULT 30,
    "invoiceDuePaymentBy" TEXT,
    "messageTitle" TEXT,
    "defaultMessage" TEXT,
    "defaultMessage2" TEXT,
    "sendLimit" INTEGER NOT NULL DEFAULT 50
);

-- CreateTable
CREATE TABLE "admin_composer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageType" TEXT,
    "toDesc" TEXT,
    "userEmail" TEXT,
    "fromEmail" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "document" TEXT,
    "messageById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "admin_composer_messageById_fkey" FOREIGN KEY ("messageById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sentStatus" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    CONSTRAINT "messages_status_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "admin_composer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_status_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "picture" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relatedId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "tableKey" TEXT NOT NULL,
    "uploadTitle" TEXT,
    "uploadDescription" TEXT
);

-- CreateTable
CREATE TABLE "job_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerAccount_key" ON "customers"("customerAccount");

-- CreateIndex
CREATE UNIQUE INDEX "job_batches_batchNo_key" ON "job_batches"("batchNo");
