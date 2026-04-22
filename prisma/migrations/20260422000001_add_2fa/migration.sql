-- AddColumn
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "totpSecret" TEXT;
