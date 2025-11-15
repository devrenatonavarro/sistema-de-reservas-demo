-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'web';

-- CreateIndex
CREATE INDEX "bookings_source_idx" ON "bookings"("source");
