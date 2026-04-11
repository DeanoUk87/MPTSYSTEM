-- AddColumn jobRef to bookings
ALTER TABLE "bookings" ADD COLUMN "jobRef" TEXT;

-- AddColumn jobRefStart to customers
ALTER TABLE "customers" ADD COLUMN "jobRefStart" INTEGER NOT NULL DEFAULT 1;
