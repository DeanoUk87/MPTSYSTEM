-- Soft-delete support for bookings
ALTER TABLE "bookings" ADD COLUMN "deletedAt" DATETIME;
