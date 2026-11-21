-- AlterTable
ALTER TABLE "dispensaries" ADD COLUMN "shopify_storefront_param" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sub_orders" ADD COLUMN "handoff_warnings" JSONB;

