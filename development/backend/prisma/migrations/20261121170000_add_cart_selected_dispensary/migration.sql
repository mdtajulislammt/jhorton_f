-- AlterTable
ALTER TABLE "carts" ADD COLUMN "selected_dispensary_id" TEXT,
ADD COLUMN "selection_source" "AssignmentSource";

-- CreateIndex
CREATE INDEX "carts_selected_dispensary_id_idx" ON "carts"("selected_dispensary_id");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_selected_dispensary_id_fkey" FOREIGN KEY ("selected_dispensary_id") REFERENCES "dispensaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
