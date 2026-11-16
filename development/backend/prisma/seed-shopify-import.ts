import { PrismaClient, StrainType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ShopifyImportProduct {
  shopifyLegacyId: string;
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  strainName: string;
  strainType: StrainType;
  brandSlug: string;
  thcPercent: number;
  cbdPercent?: number;
  weightGrams: number;
  imageUrls: string[];
  owtletPrice?: number;
  sku: string;
  terrificProductId?: string;
  inventories: Array<{
    dispensarySlug: string;
    price?: number;
    stockQty: number;
  }>;
}

/**
 * 22 Authentic Shopify Test Cannabis Products from Store f1jc7p-fs
 * Used for catalog scaffolding, test orders, and multi-dispensary fulfillment simulation.
 */
const shopifyTestCatalog: ShopifyImportProduct[] = [
  // 1. Flower
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200001',
    name: 'Blue Dream Craft Eighth 3.5g',
    slug: 'blue-dream-craft-eighth-3-5g',
    description: 'Sweet berry aroma with balanced uplifting cerebral energy and smooth physical relaxation.',
    categorySlug: 'flower',
    strainName: 'Blue Dream',
    strainType: StrainType.HYBRID,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 24.5,
    cbdPercent: 0.15,
    weightGrams: 3.5,
    imageUrls: ['/products/flower-blue-dream.jpg'],
    owtletPrice: 50.0,
    sku: 'HVB-BD-35G',
    terrificProductId: 'terrific-prod-blue-dream-35g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 55.0, stockQty: 25 },
      { dispensarySlug: 'kings-county', price: 50.0, stockQty: 15 },
      { dispensarySlug: 'empire-express', price: 52.0, stockQty: 30 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200002',
    name: 'Sour Diesel Premium Eighth 3.5g',
    slug: 'sour-diesel-premium-eighth-3-5g',
    description: 'Classic pungent fuel profile delivering invigorating, fast-acting daytime focus.',
    categorySlug: 'flower',
    strainName: 'Sour Diesel',
    strainType: StrainType.SATIVA,
    brandSlug: 'gotham-select',
    thcPercent: 26.2,
    cbdPercent: 0.1,
    weightGrams: 3.5,
    imageUrls: ['/products/flower-sour-diesel.jpg'],
    sku: 'GS-SD-35G',
    terrificProductId: 'terrific-prod-sour-diesel-35g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 58.0, stockQty: 18 },
      { dispensarySlug: 'kings-county', price: 56.0, stockQty: 12 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200003',
    name: 'OG Kush Reserve Flower 3.5g',
    slug: 'og-kush-reserve-flower-3-5g',
    description: 'Earthy pine and citrus terpene bouquet offering deep full-body tranquility.',
    categorySlug: 'flower',
    strainName: 'OG Kush',
    strainType: StrainType.INDICA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 25.8,
    cbdPercent: 0.2,
    weightGrams: 3.5,
    imageUrls: ['/products/flower-og-kush.jpg'],
    owtletPrice: 52.0,
    sku: 'HVB-OGK-35G',
    terrificProductId: 'terrific-prod-og-kush-35g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 60.0, stockQty: 14 },
      { dispensarySlug: 'empire-express', price: 52.0, stockQty: 22 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200004',
    name: 'Gelato #33 Indoor Flower 3.5g',
    slug: 'gelato-33-indoor-flower-3-5g',
    description: 'Sweet sherbet and citrus tones offering blissful mental euphoria and relaxed mood.',
    categorySlug: 'flower',
    strainName: 'Gelato #33',
    strainType: StrainType.HYBRID,
    brandSlug: 'gotham-select',
    thcPercent: 27.4,
    cbdPercent: 0.1,
    weightGrams: 3.5,
    imageUrls: ['/products/flower-gelato-33.jpg'],
    sku: 'GS-GEL-35G',
    terrificProductId: 'terrific-prod-gelato-35g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 62.0, stockQty: 8 },
      { dispensarySlug: 'kings-county', price: 60.0, stockQty: 20 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200005',
    name: 'Granddaddy Purple Sungrown 3.5g',
    slug: 'granddaddy-purple-sungrown-3-5g',
    description: 'Rich grape and wild berry notes providing supreme nighttime comfort and restful calm.',
    categorySlug: 'flower',
    strainName: 'Granddaddy Purple',
    strainType: StrainType.INDICA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 23.0,
    cbdPercent: 0.3,
    weightGrams: 3.5,
    imageUrls: ['/products/flower-gdp.jpg'],
    sku: 'HVB-GDP-35G',
    inventories: [
      { dispensarySlug: 'kings-county', price: 48.0, stockQty: 16 },
      { dispensarySlug: 'empire-express', price: 46.0, stockQty: 19 },
    ],
  },

  // 2. Pre-Rolls
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200006',
    name: 'Sour Diesel Single Pre-Roll 1g',
    slug: 'sour-diesel-single-pre-roll-1g',
    description: 'Single-source whole flower 1g joint rolled in unbleached organic hemp paper.',
    categorySlug: 'pre-rolls',
    strainName: 'Sour Diesel',
    strainType: StrainType.SATIVA,
    brandSlug: 'gotham-select',
    thcPercent: 25.0,
    cbdPercent: 0.1,
    weightGrams: 1.0,
    imageUrls: ['/products/preroll-sour-diesel-1g.jpg'],
    owtletPrice: 18.0,
    sku: 'GS-SD-PR-1G',
    terrificProductId: 'terrific-prod-sd-preroll-1g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 20.0, stockQty: 50 },
      { dispensarySlug: 'kings-county', price: 18.0, stockQty: 40 },
      { dispensarySlug: 'empire-express', price: 19.0, stockQty: 35 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200007',
    name: 'Blue Dream 5-Pack Pre-Rolls (2.5g total)',
    slug: 'blue-dream-5-pack-pre-rolls-2-5g',
    description: 'Five mini half-gram joints perfectly sized for on-the-go social enjoyment.',
    categorySlug: 'pre-rolls',
    strainName: 'Blue Dream',
    strainType: StrainType.HYBRID,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 24.0,
    cbdPercent: 0.1,
    weightGrams: 2.5,
    imageUrls: ['/products/preroll-bd-5pack.jpg'],
    sku: 'HVB-BD-PR-5PK',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 38.0, stockQty: 24 },
      { dispensarySlug: 'kings-county', price: 36.0, stockQty: 30 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200008',
    name: 'Jack Herer Diamond Infused Pre-Roll 1.5g',
    slug: 'jack-herer-diamond-infused-pre-roll-1-5g',
    description: 'Potent sativa flower coated in terpene sauce and crushed THCA diamonds.',
    categorySlug: 'pre-rolls',
    strainName: 'Jack Herer',
    strainType: StrainType.SATIVA,
    brandSlug: 'gotham-select',
    thcPercent: 42.5,
    cbdPercent: 0.1,
    weightGrams: 1.5,
    imageUrls: ['/products/preroll-jack-diamond.jpg'],
    owtletPrice: 32.0,
    sku: 'GS-JH-INF-15G',
    terrificProductId: 'terrific-prod-jack-diamond-15g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 35.0, stockQty: 20 },
      { dispensarySlug: 'empire-express', price: 32.0, stockQty: 25 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200009',
    name: 'OG Kush Hash-Hole Infused Pre-Roll 1.5g',
    slug: 'og-kush-hash-hole-infused-pre-roll-1-5g',
    description: 'Donut joint centered with cold-cure live rosin for massive terpene clouds.',
    categorySlug: 'pre-rolls',
    strainName: 'OG Kush',
    strainType: StrainType.INDICA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 44.0,
    cbdPercent: 0.2,
    weightGrams: 1.5,
    imageUrls: ['/products/preroll-og-donut.jpg'],
    sku: 'HVB-OGK-HH-15G',
    inventories: [
      { dispensarySlug: 'kings-county', price: 38.0, stockQty: 15 },
      { dispensarySlug: 'empire-express', price: 38.0, stockQty: 18 },
    ],
  },

  // 3. Vapes
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200010',
    name: 'Gotham Live Rosin All-in-One Vape 0.5g',
    slug: 'gotham-live-rosin-all-in-one-vape-0-5g',
    description: 'Solventless fresh frozen extraction in rechargeable ceramic pod hardware.',
    categorySlug: 'vapes',
    strainName: 'Gelato #33',
    strainType: StrainType.HYBRID,
    brandSlug: 'gotham-select',
    thcPercent: 78.5,
    cbdPercent: 0.8,
    weightGrams: 0.5,
    imageUrls: ['/products/vape-rosin-gelato.jpg'],
    owtletPrice: 55.0,
    sku: 'GS-LR-AIO-05G',
    terrificProductId: 'terrific-prod-rosin-vape-05g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 60.0, stockQty: 30 },
      { dispensarySlug: 'kings-county', price: 55.0, stockQty: 22 },
      { dispensarySlug: 'empire-express', price: 58.0, stockQty: 28 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200011',
    name: 'Jack Herer Live Terpene 510 Cart 1g',
    slug: 'jack-herer-live-terpene-510-cart-1g',
    description: 'Pure cannabis-derived terpenes paired with ultra-pure distillate.',
    categorySlug: 'vapes',
    strainName: 'Jack Herer',
    strainType: StrainType.SATIVA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 84.0,
    cbdPercent: 0.5,
    weightGrams: 1.0,
    imageUrls: ['/products/vape-jack-510.jpg'],
    sku: 'HVB-JH-510-1G',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 65.0, stockQty: 20 },
      { dispensarySlug: 'empire-express', price: 62.0, stockQty: 25 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200012',
    name: 'Granddaddy Purple Midnight 510 Cart 1g',
    slug: 'granddaddy-purple-midnight-510-cart-1g',
    description: 'Calming bedtime blend enriched with CBN and broad-spectrum terpenes.',
    categorySlug: 'vapes',
    strainName: 'Granddaddy Purple',
    strainType: StrainType.INDICA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 81.2,
    cbdPercent: 2.5,
    weightGrams: 1.0,
    imageUrls: ['/products/vape-gdp-510.jpg'],
    sku: 'HVB-GDP-510-1G',
    inventories: [
      { dispensarySlug: 'kings-county', price: 64.0, stockQty: 18 },
      { dispensarySlug: 'empire-express', price: 64.0, stockQty: 15 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200013',
    name: 'ACDC 1:1 CBD:THC Balanced Cart 1g',
    slug: 'acdc-1-1-cbd-thc-balanced-cart-1g',
    description: 'Harmonious ratio of CBD and THC for daytime equilibrium and physical ease.',
    categorySlug: 'vapes',
    strainName: 'ACDC',
    strainType: StrainType.CBD,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 41.0,
    cbdPercent: 42.0,
    weightGrams: 1.0,
    imageUrls: ['/products/vape-acdc-balanced.jpg'],
    sku: 'HVB-ACDC-1G',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 58.0, stockQty: 15 },
      { dispensarySlug: 'kings-county', price: 58.0, stockQty: 14 },
    ],
  },

  // 4. Edibles
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200014',
    name: 'Hudson Wild Berry Gummies 100mg THC',
    slug: 'hudson-wild-berry-gummies-100mg-thc',
    description: 'Ten vegan pectin gummies infused with fast-acting nano-emulsified rosin (10mg per piece).',
    categorySlug: 'edibles',
    strainName: 'Blue Dream',
    strainType: StrainType.HYBRID,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 10.0,
    cbdPercent: 0.1,
    weightGrams: 50.0,
    imageUrls: ['/products/edible-wild-berry.jpg'],
    owtletPrice: 28.0,
    sku: 'HVB-GUM-WB-100MG',
    terrificProductId: 'terrific-prod-berry-gummies-100mg',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 30.0, stockQty: 40 },
      { dispensarySlug: 'kings-county', price: 28.0, stockQty: 35 },
      { dispensarySlug: 'empire-express', price: 30.0, stockQty: 45 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200015',
    name: 'Empire Espresso Dark Chocolate Bar 100mg THC',
    slug: 'empire-espresso-dark-chocolate-bar-100mg-thc',
    description: 'Artisanal 72% single-origin dark chocolate bar sprinkled with roasted espresso beans.',
    categorySlug: 'edibles',
    strainName: 'Gelato #33',
    strainType: StrainType.HYBRID,
    brandSlug: 'gotham-select',
    thcPercent: 10.0,
    cbdPercent: 0.2,
    weightGrams: 60.0,
    imageUrls: ['/products/edible-espresso-chocolate.jpg'],
    sku: 'GS-CHOC-ESP-100MG',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 32.0, stockQty: 25 },
      { dispensarySlug: 'kings-county', price: 32.0, stockQty: 20 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200016',
    name: 'Sour Meyer Lemon Drops 100mg THC',
    slug: 'sour-meyer-lemon-drops-100mg-thc',
    description: 'Refreshing tart hard candies crafted from real fruit juice and botanical terpenes.',
    categorySlug: 'edibles',
    strainName: 'Sour Diesel',
    strainType: StrainType.SATIVA,
    brandSlug: 'gotham-select',
    thcPercent: 10.0,
    cbdPercent: 0.1,
    weightGrams: 45.0,
    imageUrls: ['/products/edible-lemon-drops.jpg'],
    sku: 'GS-CANDY-LEM-100MG',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 26.0, stockQty: 30 },
      { dispensarySlug: 'empire-express', price: 25.0, stockQty: 28 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200017',
    name: 'Sleep Tight Marionberry 100mg THC + 50mg CBN',
    slug: 'sleep-tight-marionberry-100mg-thc-50mg-cbn',
    description: 'Formulated specifically for restorative sleep with CBN and soothing chamomile.',
    categorySlug: 'edibles',
    strainName: 'Granddaddy Purple',
    strainType: StrainType.INDICA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 10.0,
    cbdPercent: 0.5,
    weightGrams: 50.0,
    imageUrls: ['/products/edible-marionberry-cbn.jpg'],
    sku: 'HVB-GUM-CBN-100MG',
    inventories: [
      { dispensarySlug: 'kings-county', price: 34.0, stockQty: 22 },
      { dispensarySlug: 'empire-express', price: 34.0, stockQty: 30 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200018',
    name: 'ACDC Orchard Peach 100mg CBD + 20mg THC',
    slug: 'acdc-orchard-peach-100mg-cbd-20mg-thc',
    description: 'Gentle micro-dose ratio promoting physical tranquility without overpowering psychoactivity.',
    categorySlug: 'edibles',
    strainName: 'ACDC',
    strainType: StrainType.CBD,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 2.0,
    cbdPercent: 10.0,
    weightGrams: 50.0,
    imageUrls: ['/products/edible-peach-cbd.jpg'],
    sku: 'HVB-GUM-PEACH-CBD',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 28.0, stockQty: 25 },
      { dispensarySlug: 'kings-county', price: 28.0, stockQty: 18 },
    ],
  },

  // 5. Concentrates
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200019',
    name: 'Gotham Cold Cure Live Rosin Badder 1g',
    slug: 'gotham-cold-cure-live-rosin-badder-1g',
    description: 'First wash 73u-159u solventless rosin badder with wet terpene finish.',
    categorySlug: 'concentrates',
    strainName: 'Gelato #33',
    strainType: StrainType.HYBRID,
    brandSlug: 'gotham-select',
    thcPercent: 82.0,
    cbdPercent: 0.3,
    weightGrams: 1.0,
    imageUrls: ['/products/concentrate-rosin-badder.jpg'],
    owtletPrice: 70.0,
    sku: 'GS-ROS-CC-1G',
    terrificProductId: 'terrific-prod-rosin-badder-1g',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 75.0, stockQty: 15 },
      { dispensarySlug: 'kings-county', price: 70.0, stockQty: 12 },
      { dispensarySlug: 'empire-express', price: 72.0, stockQty: 18 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200020',
    name: 'Sour Diesel Live Sugar Diamonds 1g',
    slug: 'sour-diesel-live-sugar-diamonds-1g',
    description: 'High-terpene full spectrum extract featuring micro-crystals drenched in sauce.',
    categorySlug: 'concentrates',
    strainName: 'Sour Diesel',
    strainType: StrainType.SATIVA,
    brandSlug: 'gotham-select',
    thcPercent: 85.5,
    cbdPercent: 0.1,
    weightGrams: 1.0,
    imageUrls: ['/products/concentrate-sugar-sour.jpg'],
    sku: 'GS-SUG-SD-1G',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 55.0, stockQty: 16 },
      { dispensarySlug: 'empire-express', price: 55.0, stockQty: 20 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200021',
    name: 'OG Kush Bubble Hash Temple Ball 1g',
    slug: 'og-kush-bubble-hash-temple-ball-1g',
    description: 'Traditional French-method aged ice water hash rich in monoterpenes.',
    categorySlug: 'concentrates',
    strainName: 'OG Kush',
    strainType: StrainType.INDICA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 68.0,
    cbdPercent: 0.4,
    weightGrams: 1.0,
    imageUrls: ['/products/concentrate-temple-ball.jpg'],
    sku: 'HVB-TB-OGK-1G',
    inventories: [
      { dispensarySlug: 'kings-county', price: 50.0, stockQty: 14 },
      { dispensarySlug: 'empire-express', price: 50.0, stockQty: 16 },
    ],
  },
  {
    shopifyLegacyId: 'gid://shopify/Product/892019200022',
    name: 'Jack Herer Live Shatter 1g',
    slug: 'jack-herer-live-shatter-1g',
    description: 'Glass-like amber clarity with bright spicy pine aroma and rapid activation.',
    categorySlug: 'concentrates',
    strainName: 'Jack Herer',
    strainType: StrainType.SATIVA,
    brandSlug: 'hudson-valley-botanics',
    thcPercent: 79.0,
    cbdPercent: 0.2,
    weightGrams: 1.0,
    imageUrls: ['/products/concentrate-jack-shatter.jpg'],
    sku: 'HVB-SHT-JH-1G',
    inventories: [
      { dispensarySlug: 'gotham-greenery', price: 45.0, stockQty: 18 },
      { dispensarySlug: 'kings-county', price: 45.0, stockQty: 15 },
    ],
  },
];

export async function runShopifyImport() {
  console.log('🔄 Starting Shopify Test-Data Import (Store f1jc7p-fs → Owtlet PostgreSQL)...');

  // Load existing categories and brands
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const strains = await prisma.strain.findMany();
  const strainMap = new Map(strains.map((s) => [s.name, s.id]));

  const brands = await prisma.brand.findMany();
  const brandMap = new Map(brands.map((b) => [b.slug, b.id]));

  const dispensaries = await prisma.dispensary.findMany();
  const dispensaryMap = new Map(dispensaries.map((d) => [d.slug, d.id]));

  let importedCount = 0;
  let inventoryCount = 0;

  for (const item of shopifyTestCatalog) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category slug '${item.categorySlug}' not found. Skipping.`);
      continue;
    }

    // Ensure strain exists
    let strainId = strainMap.get(item.strainName);
    if (!strainId) {
      const createdStrain = await prisma.strain.create({
        data: {
          name: item.strainName,
          type: item.strainType,
        },
      });
      strainId = createdStrain.id;
      strainMap.set(item.strainName, strainId);
    }

    const brandId = brandMap.get(item.brandSlug);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        categoryId,
        strainId,
        brandId,
        thcPercent: item.thcPercent,
        cbdPercent: item.cbdPercent ?? null,
        weightGrams: item.weightGrams,
        imageUrls: item.imageUrls,
        owtletPrice: item.owtletPrice ?? null,
        sku: item.sku,
        terrificProductId: item.terrificProductId ?? null,
        shopifyLegacyId: item.shopifyLegacyId,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        categoryId,
        strainId,
        brandId,
        thcPercent: item.thcPercent,
        cbdPercent: item.cbdPercent ?? null,
        weightGrams: item.weightGrams,
        imageUrls: item.imageUrls,
        owtletPrice: item.owtletPrice ?? null,
        sku: item.sku,
        terrificProductId: item.terrificProductId ?? null,
        shopifyLegacyId: item.shopifyLegacyId,
        isActive: true,
      },
    });

    importedCount++;

    // Create / update inventory per dispensary
    for (const inv of item.inventories) {
      const dispensaryId = dispensaryMap.get(inv.dispensarySlug);
      if (dispensaryId) {
        await prisma.inventory.upsert({
          where: {
            productId_dispensaryId: {
              productId: product.id,
              dispensaryId,
            },
          },
          update: {
            price: inv.price ?? null,
            stockQty: inv.stockQty,
          },
          create: {
            productId: product.id,
            dispensaryId,
            price: inv.price ?? null,
            stockQty: inv.stockQty,
          },
        });
        inventoryCount++;
      }
    }
  }

  console.log(`✅ Successfully imported ${importedCount} Shopify cannabis products.`);
  console.log(`✅ Synchronized ${inventoryCount} inventory positions across partner dispensaries.`);
}

if (require.main === module) {
  runShopifyImport()
    .catch((e) => {
      console.error('Import failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

