-- AlterTable: add configurable auto-refresh interval to settings
ALTER TABLE "settings" ADD COLUMN "bookingRefreshInterval" INTEGER NOT NULL DEFAULT 80;
