-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "StrainType" AS ENUM ('INDICA', 'SATIVA', 'HYBRID', 'CBD');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'HANDED_OFF', 'PARTIALLY_CONFIRMED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubOrderStatus" AS ENUM ('PENDING', 'HANDED_OFF', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HandoffChannel" AS ENUM ('LEAFLY', 'RETAILER_PAGE');

-- CreateEnum
CREATE TYPE "ShowStatus" AS ENUM ('SCHEDULED', 'LIVE', 'REPLAY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VideoFormat" AS ENUM ('LIVE_SHOW', 'SHOPPABLE_VIDEO');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "HoursKind" AS ENUM ('STORE', 'DELIVERY');

-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('AUTO', 'PROFILE_DEFAULT', 'SHOPPER_CHANGED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_dispensaries" (
    "brand_id" TEXT NOT NULL,
    "dispensary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_dispensaries_pkey" PRIMARY KEY ("brand_id","dispensary_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StrainType" NOT NULL,

    CONSTRAINT "strains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "brand_id" TEXT,
    "category_id" TEXT NOT NULL,
    "strain_id" TEXT,
    "thc_percent" DECIMAL(5,2),
    "cbd_percent" DECIMAL(5,2),
    "weight_grams" DECIMAL(8,2),
    "image_urls" TEXT[],
    "owtlet_price" DECIMAL(10,2),
    "sku" TEXT,
    "terrific_product_id" TEXT,
    "shopify_legacy_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensaries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "license_number" TEXT,
    "address_line1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NY',
    "zip" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "offers_pickup" BOOLEAN NOT NULL DEFAULT true,
    "offers_delivery" BOOLEAN NOT NULL DEFAULT true,
    "coverage_zips" TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "handoff_channel" "HandoffChannel" NOT NULL DEFAULT 'RETAILER_PAGE',
    "handoff_url_template" TEXT,
    "leafly_store_id" TEXT,
    "webhook_secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispensaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensary_hours" (
    "id" TEXT NOT NULL,
    "dispensary_id" TEXT NOT NULL,
    "kind" "HoursKind" NOT NULL DEFAULT 'STORE',
    "day_of_week" INTEGER NOT NULL,
    "opens_at" TEXT NOT NULL,
    "closes_at" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dispensary_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "dispensary_id" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "external_sku" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shoppers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "home_zip" TEXT,
    "default_dispensary_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shoppers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopper_addresses" (
    "id" TEXT NOT NULL,
    "shopper_id" TEXT NOT NULL,
    "label" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NY',
    "zip" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopper_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "shopper_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "shopper_id" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "zip" TEXT,
    "live_show_id" TEXT,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'catalog',
    "channel_brand_id" TEXT,
    "live_show_id" TEXT,
    "preferred_dispensary_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "cart_id" TEXT,
    "shopper_id" TEXT,
    "fulfillment_type" "FulfillmentType" NOT NULL,
    "zip" TEXT NOT NULL,
    "contact_first_name" TEXT NOT NULL,
    "contact_last_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "delivery_line1" TEXT,
    "delivery_line2" TEXT,
    "delivery_city" TEXT,
    "delivery_state" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "dispensary_id" TEXT NOT NULL,
    "fulfillment_type" "FulfillmentType" NOT NULL,
    "assignment" "AssignmentSource" NOT NULL DEFAULT 'AUTO',
    "channel_brand_id" TEXT,
    "status" "SubOrderStatus" NOT NULL DEFAULT 'PENDING',
    "handoff_channel" "HandoffChannel" NOT NULL,
    "handoff_url" TEXT,
    "handed_off_at" TIMESTAMP(3),
    "confirmation_ref" TEXT,
    "confirmation_url" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "sub_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_shows" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "format" "VideoFormat" NOT NULL DEFAULT 'LIVE_SHOW',
    "brand_id" TEXT,
    "terrific_show_id" TEXT,
    "embedding_id" TEXT NOT NULL DEFAULT 'Cki70GhqvLgWGhJbSxg2',
    "status" "ShowStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3),
    "scheduled_end_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "show_products" (
    "show_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "show_products_pkey" PRIMARY KEY ("show_id","product_id")
);

-- CreateTable
CREATE TABLE "age_verification_sessions" (
    "id" TEXT NOT NULL,
    "session_hash" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "age_verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_zips" (
    "zip" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,

    CONSTRAINT "coverage_zips_pkey" PRIMARY KEY ("zip")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brand_dispensaries_dispensary_id_idx" ON "brand_dispensaries"("dispensary_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "strains_name_key" ON "strains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_terrific_product_id_key" ON "products"("terrific_product_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_strain_id_idx" ON "products"("strain_id");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "dispensaries_slug_key" ON "dispensaries"("slug");

-- CreateIndex
CREATE INDEX "dispensaries_zip_idx" ON "dispensaries"("zip");

-- CreateIndex
CREATE UNIQUE INDEX "dispensary_hours_dispensary_id_kind_day_of_week_key" ON "dispensary_hours"("dispensary_id", "kind", "day_of_week");

-- CreateIndex
CREATE INDEX "inventory_dispensary_id_idx" ON "inventory"("dispensary_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_dispensary_id_key" ON "inventory"("product_id", "dispensary_id");

-- CreateIndex
CREATE UNIQUE INDEX "shoppers_email_key" ON "shoppers"("email");

-- CreateIndex
CREATE INDEX "shoppers_default_dispensary_id_idx" ON "shoppers"("default_dispensary_id");

-- CreateIndex
CREATE INDEX "shopper_addresses_shopper_id_idx" ON "shopper_addresses"("shopper_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_shopper_id_idx" ON "password_reset_tokens"("shopper_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_session_token_key" ON "carts"("session_token");

-- CreateIndex
CREATE INDEX "carts_expires_at_idx" ON "carts"("expires_at");

-- CreateIndex
CREATE INDEX "carts_live_show_id_idx" ON "carts"("live_show_id");

-- CreateIndex
CREATE INDEX "carts_shopper_id_idx" ON "carts"("shopper_id");

-- CreateIndex
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE INDEX "cart_items_channel_brand_id_idx" ON "cart_items"("channel_brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_channel_brand_id_key" ON "cart_items"("cart_id", "product_id", "channel_brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_cart_id_key" ON "orders"("cart_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_shopper_id_idx" ON "orders"("shopper_id");

-- CreateIndex
CREATE INDEX "sub_orders_order_id_idx" ON "sub_orders"("order_id");

-- CreateIndex
CREATE INDEX "sub_orders_dispensary_id_status_idx" ON "sub_orders"("dispensary_id", "status");

-- CreateIndex
CREATE INDEX "order_items_sub_order_id_idx" ON "order_items"("sub_order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_shows_terrific_show_id_key" ON "live_shows"("terrific_show_id");

-- CreateIndex
CREATE INDEX "live_shows_status_scheduled_at_idx" ON "live_shows"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "live_shows_brand_id_idx" ON "live_shows"("brand_id");

-- CreateIndex
CREATE INDEX "show_products_product_id_idx" ON "show_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "age_verification_sessions_session_hash_key" ON "age_verification_sessions"("session_hash");

-- AddForeignKey
ALTER TABLE "brand_dispensaries" ADD CONSTRAINT "brand_dispensaries_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_dispensaries" ADD CONSTRAINT "brand_dispensaries_dispensary_id_fkey" FOREIGN KEY ("dispensary_id") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensary_hours" ADD CONSTRAINT "dispensary_hours_dispensary_id_fkey" FOREIGN KEY ("dispensary_id") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_dispensary_id_fkey" FOREIGN KEY ("dispensary_id") REFERENCES "dispensaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoppers" ADD CONSTRAINT "shoppers_default_dispensary_id_fkey" FOREIGN KEY ("default_dispensary_id") REFERENCES "dispensaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopper_addresses" ADD CONSTRAINT "shopper_addresses_shopper_id_fkey" FOREIGN KEY ("shopper_id") REFERENCES "shoppers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_shopper_id_fkey" FOREIGN KEY ("shopper_id") REFERENCES "shoppers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_shopper_id_fkey" FOREIGN KEY ("shopper_id") REFERENCES "shoppers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_live_show_id_fkey" FOREIGN KEY ("live_show_id") REFERENCES "live_shows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_channel_brand_id_fkey" FOREIGN KEY ("channel_brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopper_id_fkey" FOREIGN KEY ("shopper_id") REFERENCES "shoppers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_dispensary_id_fkey" FOREIGN KEY ("dispensary_id") REFERENCES "dispensaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "sub_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_shows" ADD CONSTRAINT "live_shows_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_products" ADD CONSTRAINT "show_products_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "live_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_products" ADD CONSTRAINT "show_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "dispensaries_coverage_zips_gin_idx" ON "dispensaries" USING GIN ("coverage_zips");

