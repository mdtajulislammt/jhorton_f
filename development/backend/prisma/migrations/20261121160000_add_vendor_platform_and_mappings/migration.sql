-- CreateEnum
CREATE TYPE "VendorPlatform" AS ENUM ('WOOCOMMERCE', 'SHOPIFY', 'BIGCOMMERCE', 'OTHER');

-- AlterTable
ALTER TABLE "dispensaries" ADD COLUMN "platform" "VendorPlatform" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "cart_base_url" TEXT,
ADD COLUMN "allowed_hosts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "handoff_notes" TEXT,
ADD COLUMN "last_health_check_at" TIMESTAMP(3),
ADD COLUMN "health_status" TEXT;

-- CreateTable
CREATE TABLE "vendor_product_mappings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "dispensary_id" TEXT NOT NULL,
    "our_sku" TEXT NOT NULL,
    "vendor_product_id" TEXT,
    "vendor_variant_id" TEXT,
    "vendor_sku" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_product_mappings_product_id_dispensary_id_key" ON "vendor_product_mappings"("product_id", "dispensary_id");

-- CreateIndex
CREATE INDEX "vendor_product_mappings_dispensary_id_idx" ON "vendor_product_mappings"("dispensary_id");

-- AddForeignKey
ALTER TABLE "vendor_product_mappings" ADD CONSTRAINT "vendor_product_mappings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_product_mappings" ADD CONSTRAINT "vendor_product_mappings_dispensary_id_fkey" FOREIGN KEY ("dispensary_id") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
