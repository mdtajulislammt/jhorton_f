-- AlterEnum
-- First update any existing rows to use text values compatible with new enum
ALTER TABLE "dispensaries" ALTER COLUMN "handoff_channel" DROP DEFAULT;
ALTER TABLE "sub_orders" ALTER COLUMN "handoff_channel" DROP DEFAULT;

-- Step 1: Alter column to text
ALTER TABLE "dispensaries" ALTER COLUMN "handoff_channel" TYPE TEXT USING 'DEEP_LINK';
ALTER TABLE "sub_orders" ALTER COLUMN "handoff_channel" TYPE TEXT USING 'DEEP_LINK';

-- Step 2: Drop old enum and create new enum
DROP TYPE "HandoffChannel";
CREATE TYPE "HandoffChannel" AS ENUM ('WOOCOMMERCE', 'SHOPIFY', 'BIGCOMMERCE', 'DEEP_LINK', 'ORDER_REQUEST');

-- Step 3: Convert columns back to new enum
ALTER TABLE "dispensaries" ALTER COLUMN "handoff_channel" TYPE "HandoffChannel" USING "handoff_channel"::"HandoffChannel";
ALTER TABLE "dispensaries" ALTER COLUMN "handoff_channel" SET DEFAULT 'DEEP_LINK';

ALTER TABLE "sub_orders" ALTER COLUMN "handoff_channel" TYPE "HandoffChannel" USING "handoff_channel"::"HandoffChannel";

-- Step 4: Add CONVERTED to CartStatus enum
ALTER TYPE "CartStatus" ADD VALUE 'CONVERTED';

-- Step 5: Drop leafly_store_id column
ALTER TABLE "dispensaries" DROP COLUMN IF EXISTS "leafly_store_id";

