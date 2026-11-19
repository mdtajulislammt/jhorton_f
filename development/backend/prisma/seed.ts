import { PrismaClient, Role, StrainType, HoursKind, HandoffChannel, ShowStatus, VideoFormat } from '@prisma/client';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Owtlet database seed...');

  // 1. Seed Coverage ZIPs
  console.log('📦 Seeding coverage ZIPs (NY 5-region coverage)...');
  const zipsPath = path.join(__dirname, 'data', 'coverage-zips.json');
  const zipsData: Array<{ zip: string; region: string; latitude: number; longitude: number }> = JSON.parse(
    fs.readFileSync(zipsPath, 'utf8')
  );

  for (const zipItem of zipsData) {
    await prisma.coverageZip.upsert({
      where: { zip: zipItem.zip },
      update: {
        region: zipItem.region,
        latitude: zipItem.latitude,
        longitude: zipItem.longitude,
      },
      create: {
        zip: zipItem.zip,
        region: zipItem.region,
        latitude: zipItem.latitude,
        longitude: zipItem.longitude,
      },
    });
  }
  console.log(`  ✔ Seeded ${zipsData.length} coverage ZIP codes.`);

  // 2. Admin User
  console.log('👤 Seeding admin user...');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'ops@owtlet.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'change_me_admin_password_min_12_chars';
  const adminPasswordHash = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.SUPERADMIN,
      name: 'Owtlet Operations Lead',
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: Role.SUPERADMIN,
      name: 'Owtlet Operations Lead',
      isActive: true,
    },
  });
  console.log(`  ✔ Admin user ready: ${admin.email} (${admin.role})`);

  // 3. Categories (Cannabis only — zero accessory categories)
  console.log('🏷️  Seeding cannabis categories...');
  const categories = [
    { name: 'Flower', slug: 'flower', sortOrder: 1 },
    { name: 'Pre-Rolls', slug: 'pre-rolls', sortOrder: 2 },
    { name: 'Vapes', slug: 'vapes', sortOrder: 3 },
    { name: 'Edibles', slug: 'edibles', sortOrder: 4 },
    { name: 'Concentrates', slug: 'concentrates', sortOrder: 5 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap[cat.slug] = record.id;
  }
  console.log(`  ✔ Seeded ${categories.length} categories.`);

  // 4. Strains
  console.log('🌿 Seeding cannabis strains...');
  const strains = [
    { name: 'Blue Dream', type: StrainType.HYBRID },
    { name: 'Sour Diesel', type: StrainType.SATIVA },
    { name: 'OG Kush', type: StrainType.INDICA },
    { name: 'Gelato #33', type: StrainType.HYBRID },
    { name: 'ACDC', type: StrainType.CBD },
    { name: 'Granddaddy Purple', type: StrainType.INDICA },
    { name: 'Jack Herer', type: StrainType.SATIVA },
  ];

  const strainMap: Record<string, string> = {};
  for (const s of strains) {
    const record = await prisma.strain.upsert({
      where: { name: s.name },
      update: { type: s.type },
      create: s,
    });
    strainMap[s.name] = record.id;
  }
  console.log(`  ✔ Seeded ${strains.length} strains.`);

  // 5. Dispensaries (3 Demo Retailers: Both, Pickup-Only, Delivery-Only)
  console.log('🏪 Seeding dispensaries...');
  const manhattanDeliveryZips = [
    '10001', '10002', '10003', '10011', '10012', '10013', '10014',
    '10016', '10019', '10021', '10022', '10025', '10028', '10036',
    '11101', '11102', '11106',
  ];
  const outerBoroughDeliveryZips = [
    '11101', '11102', '11106', '11375', '11377', '11385',
    '11201', '11211', '11222', '11249',
    '11501', '11530', '11550', '11735', '11753', '11791',
  ];

  // Dispensary 1: Manhattan (Both Pickup and Delivery)
  const gotham = await prisma.dispensary.upsert({
    where: { slug: 'gotham-greenery-manhattan' },
    update: {
      name: 'Gotham Greenery — Manhattan',
      licenseNumber: 'OCM-CAURD-2023-00042',
      addressLine1: '120 5th Ave',
      city: 'New York',
      state: 'NY',
      zip: '10011',
      latitude: 40.7384,
      longitude: -73.9928,
      offersPickup: true,
      offersDelivery: true,
      coverageZips: manhattanDeliveryZips,
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://gothamgreenery.ny.retailer.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_gotham_greenery_demo_key',
      isActive: true,
    },
    create: {
      name: 'Gotham Greenery — Manhattan',
      slug: 'gotham-greenery-manhattan',
      licenseNumber: 'OCM-CAURD-2023-00042',
      addressLine1: '120 5th Ave',
      city: 'New York',
      state: 'NY',
      zip: '10011',
      latitude: 40.7384,
      longitude: -73.9928,
      offersPickup: true,
      offersDelivery: true,
      coverageZips: manhattanDeliveryZips,
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://gothamgreenery.ny.retailer.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_gotham_greenery_demo_key',
      isActive: true,
    },
  });

  // Dispensary 2: Brooklyn (Pickup ONLY)
  const kings = await prisma.dispensary.upsert({
    where: { slug: 'kings-county-botanicals-brooklyn' },
    update: {
      name: 'Kings County Botanicals — Brooklyn',
      licenseNumber: 'OCM-CAURD-2023-00088',
      addressLine1: '245 Bedford Ave',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11211',
      latitude: 40.7163,
      longitude: -73.9592,
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.LEAFLY,
      leaflyStoreId: 'leafly-store-kings-county-bk',
      webhookSecret: 'whsec_kings_county_demo_key',
      isActive: true,
    },
    create: {
      name: 'Kings County Botanicals — Brooklyn',
      slug: 'kings-county-botanicals-brooklyn',
      licenseNumber: 'OCM-CAURD-2023-00088',
      addressLine1: '245 Bedford Ave',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11211',
      latitude: 40.7163,
      longitude: -73.9592,
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.LEAFLY,
      leaflyStoreId: 'leafly-store-kings-county-bk',
      webhookSecret: 'whsec_kings_county_demo_key',
      isActive: true,
    },
  });

  // Dispensary 3: Queens / Long Island (Delivery ONLY)
  const empire = await prisma.dispensary.upsert({
    where: { slug: 'empire-express-delivery' },
    update: {
      name: 'Empire Express Delivery — Queens & Long Island',
      licenseNumber: 'OCM-CAURD-2024-00112',
      addressLine1: '30-30 47th Ave',
      city: 'Long Island City',
      state: 'NY',
      zip: '11101',
      latitude: 40.7423,
      longitude: -73.9318,
      offersPickup: false,
      offersDelivery: true,
      coverageZips: outerBoroughDeliveryZips,
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://empireexpress.delivery/checkout?ref={subOrderId}',
      webhookSecret: 'whsec_empire_express_demo_key',
      isActive: true,
    },
    create: {
      name: 'Empire Express Delivery — Queens & Long Island',
      slug: 'empire-express-delivery',
      licenseNumber: 'OCM-CAURD-2024-00112',
      addressLine1: '30-30 47th Ave',
      city: 'Long Island City',
      state: 'NY',
      zip: '11101',
      latitude: 40.7423,
      longitude: -73.9318,
      offersPickup: false,
      offersDelivery: true,
      coverageZips: outerBoroughDeliveryZips,
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://empireexpress.delivery/checkout?ref={subOrderId}',
      webhookSecret: 'whsec_empire_express_demo_key',
      isActive: true,
    },
  });

  console.log('  ✔ Dispensaries created: Gotham Greenery (both), Kings County (pickup), Empire Express (delivery).');

  // 6. Dispensary Hours (STORE & DELIVERY hours for each store)
  console.log('⏰ Seeding dispensary STORE & DELIVERY hours...');
  for (let day = 0; day <= 6; day++) {
    // Gotham: open for pickup 09:00-22:00, delivery 11:00-21:00
    await prisma.dispensaryHours.upsert({
      where: {
        dispensaryId_kind_dayOfWeek: {
          dispensaryId: gotham.id,
          kind: HoursKind.STORE,
          dayOfWeek: day,
        },
      },
      update: { opensAt: '09:00', closesAt: '22:00', isClosed: false },
      create: {
        dispensaryId: gotham.id,
        kind: HoursKind.STORE,
        dayOfWeek: day,
        opensAt: '09:00',
        closesAt: '22:00',
        isClosed: false,
      },
    });
    await prisma.dispensaryHours.upsert({
      where: {
        dispensaryId_kind_dayOfWeek: {
          dispensaryId: gotham.id,
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
        },
      },
      update: { opensAt: '11:00', closesAt: '21:00', isClosed: false },
      create: {
        dispensaryId: gotham.id,
        kind: HoursKind.DELIVERY,
        dayOfWeek: day,
        opensAt: '11:00',
        closesAt: '21:00',
        isClosed: false,
      },
    });

    // Kings County: open for pickup 10:00-22:00; DELIVERY closed
    await prisma.dispensaryHours.upsert({
      where: {
        dispensaryId_kind_dayOfWeek: {
          dispensaryId: kings.id,
          kind: HoursKind.STORE,
          dayOfWeek: day,
        },
      },
      update: { opensAt: '10:00', closesAt: '22:00', isClosed: false },
      create: {
        dispensaryId: kings.id,
        kind: HoursKind.STORE,
        dayOfWeek: day,
        opensAt: '10:00',
        closesAt: '22:00',
        isClosed: false,
      },
    });
    await prisma.dispensaryHours.upsert({
      where: {
        dispensaryId_kind_dayOfWeek: {
          dispensaryId: kings.id,
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
        },
      },
      update: { opensAt: '00:00', closesAt: '00:00', isClosed: true },
      create: {
        dispensaryId: kings.id,
        kind: HoursKind.DELIVERY,
        dayOfWeek: day,
        opensAt: '00:00',
        closesAt: '00:00',
        isClosed: true,
      },
    });

    // Empire Express: STORE closed; open for DELIVERY 10:00-23:00
    await prisma.dispensaryHours.upsert({
      where: {
        dispensaryId_kind_dayOfWeek: {
          dispensaryId: empire.id,
          kind: HoursKind.STORE,
          dayOfWeek: day,
        },
      },
      update: { opensAt: '00:00', closesAt: '00:00', isClosed: true },
      create: {
        dispensaryId: empire.id,
        kind: HoursKind.STORE,
        dayOfWeek: day,
        opensAt: '00:00',
        closesAt: '00:00',
        isClosed: true,
      },
    });
    await prisma.dispensaryHours.upsert({
      where: {
        dispensaryId_kind_dayOfWeek: {
          dispensaryId: empire.id,
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
        },
      },
      update: { opensAt: '10:00', closesAt: '23:00', isClosed: false },
      create: {
        dispensaryId: empire.id,
        kind: HoursKind.DELIVERY,
        dayOfWeek: day,
        opensAt: '10:00',
        closesAt: '23:00',
        isClosed: false,
      },
    });
  }
  console.log('  ✔ Dispensary hours configured.');

  // 7. Brands & Brand Storefronts (Channels)
  console.log('🏷️  Seeding brands and store assignments...');
  const brand1 = await prisma.brand.upsert({
    where: { slug: 'hudson-valley-botanics' },
    update: {
      name: 'Hudson Valley Botanics',
      description: 'Sun-grown craft cannabis harvested in upstate New York, cured to perfection for maximum terpene preservation.',
      logoUrl: '/brands/hvb-logo.svg',
      bannerUrl: '/brands/hvb-banner.jpg',
      isActive: true,
      sortOrder: 1,
    },
    create: {
      name: 'Hudson Valley Botanics',
      slug: 'hudson-valley-botanics',
      description: 'Sun-grown craft cannabis harvested in upstate New York, cured to perfection for maximum terpene preservation.',
      logoUrl: '/brands/hvb-logo.svg',
      bannerUrl: '/brands/hvb-banner.jpg',
      isActive: true,
      sortOrder: 1,
    },
  });

  const brand2 = await prisma.brand.upsert({
    where: { slug: 'gotham-select' },
    update: {
      name: 'Gotham Select',
      description: 'Premium indoor craft flower and artisanal live rosin vapes curated for discerning New York palates.',
      logoUrl: '/brands/gotham-select-logo.svg',
      bannerUrl: '/brands/gotham-select-banner.jpg',
      isActive: true,
      sortOrder: 2,
    },
    create: {
      name: 'Gotham Select',
      slug: 'gotham-select',
      description: 'Premium indoor craft flower and artisanal live rosin vapes curated for discerning New York palates.',
      logoUrl: '/brands/gotham-select-logo.svg',
      bannerUrl: '/brands/gotham-select-banner.jpg',
      isActive: true,
      sortOrder: 2,
    },
  });

  // Brand-Dispensary assignments (Brand 1 -> Gotham & Empire; Brand 2 -> Gotham & Kings County)
  await prisma.brandDispensary.upsert({
    where: { brandId_dispensaryId: { brandId: brand1.id, dispensaryId: gotham.id } },
    update: {},
    create: { brandId: brand1.id, dispensaryId: gotham.id },
  });
  await prisma.brandDispensary.upsert({
    where: { brandId_dispensaryId: { brandId: brand1.id, dispensaryId: empire.id } },
    update: {},
    create: { brandId: brand1.id, dispensaryId: empire.id },
  });
  await prisma.brandDispensary.upsert({
    where: { brandId_dispensaryId: { brandId: brand2.id, dispensaryId: gotham.id } },
    update: {},
    create: { brandId: brand2.id, dispensaryId: gotham.id },
  });
  await prisma.brandDispensary.upsert({
    where: { brandId_dispensaryId: { brandId: brand2.id, dispensaryId: kings.id } },
    update: {},
    create: { brandId: brand2.id, dispensaryId: kings.id },
  });
  console.log('  ✔ Brands & BrandDispensary partner mappings created.');

  // 8. Products
  console.log('📦 Seeding products (show products with owtletPrice + catalog products)...');

  // Product 1: Show Product (Flower, Blue Dream, owtletPrice = $50.00)
  const prod1 = await prisma.product.upsert({
    where: { slug: 'blue-dream-craft-eighth-3-5g' },
    update: {
      name: 'Blue Dream Craft Eighth 3.5g',
      description: 'Legendary sweet berry aroma with balanced uplifting cerebral energy and smooth physical relaxation.',
      brandId: brand1.id,
      categoryId: categoryMap['flower'],
      strainId: strainMap['Blue Dream'],
      thcPercent: 24.50,
      cbdPercent: 0.15,
      weightGrams: 3.50,
      imageUrls: ['/products/flower-blue-dream.jpg'],
      owtletPrice: 50.00,
      sku: 'HVB-BD-35G',
      terrificProductId: 'terrific-prod-blue-dream-35g',
      isActive: true,
    },
    create: {
      name: 'Blue Dream Craft Eighth 3.5g',
      slug: 'blue-dream-craft-eighth-3-5g',
      description: 'Legendary sweet berry aroma with balanced uplifting cerebral energy and smooth physical relaxation.',
      brandId: brand1.id,
      categoryId: categoryMap['flower'],
      strainId: strainMap['Blue Dream'],
      thcPercent: 24.50,
      cbdPercent: 0.15,
      weightGrams: 3.50,
      imageUrls: ['/products/flower-blue-dream.jpg'],
      owtletPrice: 50.00,
      sku: 'HVB-BD-35G',
      terrificProductId: 'terrific-prod-blue-dream-35g',
      isActive: true,
    },
  });

  // Product 2: Show Product (Vape, Gelato #33, owtletPrice = $65.00)
  const prod2 = await prisma.product.upsert({
    where: { slug: 'live-rosin-all-in-one-vape-1g' },
    update: {
      name: 'Live Rosin All-in-One Vape 1.0g',
      description: 'Single-source solventless live rosin extracted at peak maturity. Rich terpene profile with sweet citrus notes.',
      brandId: brand2.id,
      categoryId: categoryMap['vapes'],
      strainId: strainMap['Gelato #33'],
      thcPercent: 78.20,
      cbdPercent: 1.10,
      weightGrams: 1.00,
      imageUrls: ['/products/vape-live-rosin.jpg'],
      owtletPrice: 65.00,
      sku: 'GS-VAPE-LR-1G',
      terrificProductId: 'terrific-prod-live-rosin-vape-1g',
      isActive: true,
    },
    create: {
      name: 'Live Rosin All-in-One Vape 1.0g',
      slug: 'live-rosin-all-in-one-vape-1g',
      description: 'Single-source solventless live rosin extracted at peak maturity. Rich terpene profile with sweet citrus notes.',
      brandId: brand2.id,
      categoryId: categoryMap['vapes'],
      strainId: strainMap['Gelato #33'],
      thcPercent: 78.20,
      cbdPercent: 1.10,
      weightGrams: 1.00,
      imageUrls: ['/products/vape-live-rosin.jpg'],
      owtletPrice: 65.00,
      sku: 'GS-VAPE-LR-1G',
      terrificProductId: 'terrific-prod-live-rosin-vape-1g',
      isActive: true,
    },
  });

  // Product 3: Show Product (Pre-Rolls, Sour Diesel, owtletPrice = $38.00)
  const prod3 = await prisma.product.upsert({
    where: { slug: 'sour-diesel-reserve-pre-roll-5pack' },
    update: {
      name: 'Sour Diesel Reserve Pre-Roll 5-Pack (2.5g)',
      description: 'Five 0.5g whole-flower joints packaged in an airtight tin. Pungent diesel gas notes with invigorating energy.',
      brandId: brand1.id,
      categoryId: categoryMap['pre-rolls'],
      strainId: strainMap['Sour Diesel'],
      thcPercent: 26.80,
      cbdPercent: 0.20,
      weightGrams: 2.50,
      imageUrls: ['/products/preroll-sour-diesel.jpg'],
      owtletPrice: 38.00,
      sku: 'HVB-PR-SD-5PK',
      terrificProductId: 'terrific-prod-sour-diesel-prerolls',
      isActive: true,
    },
    create: {
      name: 'Sour Diesel Reserve Pre-Roll 5-Pack (2.5g)',
      slug: 'sour-diesel-reserve-pre-roll-5pack',
      description: 'Five 0.5g whole-flower joints packaged in an airtight tin. Pungent diesel gas notes with invigorating energy.',
      brandId: brand1.id,
      categoryId: categoryMap['pre-rolls'],
      strainId: strainMap['Sour Diesel'],
      thcPercent: 26.80,
      cbdPercent: 0.20,
      weightGrams: 2.50,
      imageUrls: ['/products/preroll-sour-diesel.jpg'],
      owtletPrice: 38.00,
      sku: 'HVB-PR-SD-5PK',
      terrificProductId: 'terrific-prod-sour-diesel-prerolls',
      isActive: true,
    },
  });

  // Product 4: Non-Show Product (Edibles, per-store prices)
  const prod4 = await prisma.product.upsert({
    where: { slug: 'meyer-lemon-gummies-100mg' },
    update: {
      name: 'Artisanal Meyer Lemon Gummies 100mg (10-Pack)',
      description: 'Ten delicious 10mg vegan pectin gummies infused with full-spectrum cannabis extract and real citrus juice.',
      brandId: brand2.id,
      categoryId: categoryMap['edibles'],
      strainId: strainMap['Gelato #33'],
      thcPercent: 10.00,
      cbdPercent: 0.50,
      weightGrams: 50.00,
      imageUrls: ['/products/edibles-lemon-gummies.jpg'],
      owtletPrice: null, // Per-store pricing!
      sku: 'GS-ED-LEMON-100MG',
      isActive: true,
    },
    create: {
      name: 'Artisanal Meyer Lemon Gummies 100mg (10-Pack)',
      slug: 'meyer-lemon-gummies-100mg',
      description: 'Ten delicious 10mg vegan pectin gummies infused with full-spectrum cannabis extract and real citrus juice.',
      brandId: brand2.id,
      categoryId: categoryMap['edibles'],
      strainId: strainMap['Gelato #33'],
      thcPercent: 10.00,
      cbdPercent: 0.50,
      weightGrams: 50.00,
      imageUrls: ['/products/edibles-lemon-gummies.jpg'],
      owtletPrice: null,
      sku: 'GS-ED-LEMON-100MG',
      isActive: true,
    },
  });

  // Product 5: Non-Show Product (Concentrates, per-store prices)
  const prod5 = await prisma.product.upsert({
    where: { slug: 'og-kush-live-badder-1g' },
    update: {
      name: 'Live Badder Concentrate 1.0g',
      description: 'Ultra-pure whipped live resin with heavy earthen pine aroma and deeply relaxing body effect.',
      brandId: brand1.id,
      categoryId: categoryMap['concentrates'],
      strainId: strainMap['OG Kush'],
      thcPercent: 81.40,
      cbdPercent: 0.40,
      weightGrams: 1.00,
      imageUrls: ['/products/conc-live-badder.jpg'],
      owtletPrice: null, // Per-store pricing!
      sku: 'HVB-CONC-BAD-1G',
      isActive: true,
    },
    create: {
      name: 'Live Badder Concentrate 1.0g',
      slug: 'og-kush-live-badder-1g',
      description: 'Ultra-pure whipped live resin with heavy earthen pine aroma and deeply relaxing body effect.',
      brandId: brand1.id,
      categoryId: categoryMap['concentrates'],
      strainId: strainMap['OG Kush'],
      thcPercent: 81.40,
      cbdPercent: 0.40,
      weightGrams: 1.00,
      imageUrls: ['/products/conc-live-badder.jpg'],
      owtletPrice: null,
      sku: 'HVB-CONC-BAD-1G',
      isActive: true,
    },
  });

  console.log('  ✔ Products created: 3 with owtletPrice (show items) and 2 with per-store pricing.');

  // 9. Stock Inventory
  console.log('📊 Seeding inventory across partner stores...');
  // Prod 1 (Blue Dream): Gotham & Empire
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod1.id, dispensaryId: gotham.id } },
    update: { stockQty: 45, price: null },
    create: { productId: prod1.id, dispensaryId: gotham.id, stockQty: 45, price: null },
  });
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod1.id, dispensaryId: empire.id } },
    update: { stockQty: 30, price: null },
    create: { productId: prod1.id, dispensaryId: empire.id, stockQty: 30, price: null },
  });

  // Prod 2 (Live Rosin Vape): Gotham & Kings County
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod2.id, dispensaryId: gotham.id } },
    update: { stockQty: 60, price: null },
    create: { productId: prod2.id, dispensaryId: gotham.id, stockQty: 60, price: null },
  });
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod2.id, dispensaryId: kings.id } },
    update: { stockQty: 25, price: null },
    create: { productId: prod2.id, dispensaryId: kings.id, stockQty: 25, price: null },
  });

  // Prod 3 (Sour Diesel Pre-Roll): Gotham & Empire
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod3.id, dispensaryId: gotham.id } },
    update: { stockQty: 50, price: null },
    create: { productId: prod3.id, dispensaryId: gotham.id, stockQty: 50, price: null },
  });
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod3.id, dispensaryId: empire.id } },
    update: { stockQty: 40, price: null },
    create: { productId: prod3.id, dispensaryId: empire.id, stockQty: 40, price: null },
  });

  // Prod 4 (Meyer Lemon Gummies): Per-store prices
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod4.id, dispensaryId: gotham.id } },
    update: { stockQty: 35, price: 32.00 },
    create: { productId: prod4.id, dispensaryId: gotham.id, stockQty: 35, price: 32.00 },
  });
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod4.id, dispensaryId: kings.id } },
    update: { stockQty: 20, price: 30.00 },
    create: { productId: prod4.id, dispensaryId: kings.id, stockQty: 20, price: 30.00 },
  });

  // Prod 5 (Live Badder Concentrate): Per-store prices
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod5.id, dispensaryId: gotham.id } },
    update: { stockQty: 18, price: 60.00 },
    create: { productId: prod5.id, dispensaryId: gotham.id, stockQty: 18, price: 60.00 },
  });
  await prisma.inventory.upsert({
    where: { productId_dispensaryId: { productId: prod5.id, dispensaryId: empire.id } },
    update: { stockQty: 22, price: 58.00 },
    create: { productId: prod5.id, dispensaryId: empire.id, stockQty: 22, price: 58.00 },
  });
  console.log('  ✔ Store inventory stocked.');

  // 10. Live Show & Pinned Products
  console.log('📺 Seeding live show & pinned show products...');
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const fortyFiveMinutesLater = new Date(now.getTime() + 45 * 60 * 1000);

  const liveShow = await prisma.liveShow.upsert({
    where: { terrificShowId: 'terrific-show-launch-drop-001' },
    update: {
      title: 'Owtlet Launch Drop: Curated NY Craft Live',
      description: 'Join us live with master growers from Hudson Valley Botanics and Gotham Select. Exclusive show pricing on Blue Dream and Live Rosin.',
      format: VideoFormat.LIVE_SHOW,
      status: ShowStatus.LIVE,
      scheduledAt: fifteenMinutesAgo,
      startedAt: fifteenMinutesAgo,
      scheduledEndAt: fortyFiveMinutesLater,
      thumbnailUrl: '/shows/launch-drop-thumb.jpg',
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
    },
    create: {
      title: 'Owtlet Launch Drop: Curated NY Craft Live',
      description: 'Join us live with master growers from Hudson Valley Botanics and Gotham Select. Exclusive show pricing on Blue Dream and Live Rosin.',
      format: VideoFormat.LIVE_SHOW,
      status: ShowStatus.LIVE,
      scheduledAt: fifteenMinutesAgo,
      startedAt: fifteenMinutesAgo,
      scheduledEndAt: fortyFiveMinutesLater,
      thumbnailUrl: '/shows/launch-drop-thumb.jpg',
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
      terrificShowId: 'terrific-show-launch-drop-001',
    },
  });

  // Pin products to the live show (all 3 show products have owtletPrice)
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: liveShow.id, productId: prod1.id } },
    update: { sortOrder: 1 },
    create: { showId: liveShow.id, productId: prod1.id, sortOrder: 1 },
  });
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: liveShow.id, productId: prod2.id } },
    update: { sortOrder: 2 },
    create: { showId: liveShow.id, productId: prod2.id, sortOrder: 2 },
  });
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: liveShow.id, productId: prod3.id } },
    update: { sortOrder: 3 },
    create: { showId: liveShow.id, productId: prod3.id, sortOrder: 3 },
  });
  console.log(`  ✔ Live show active: "${liveShow.title}" with 3 pinned products.`);

  // 10b. Upcoming Show, Replay & Shoppable Video Reels (TASK-016)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  const upcomingShow = await prisma.liveShow.upsert({
    where: { terrificShowId: 'terrific-show-upcoming-002' },
    update: {
      title: 'Hudson Valley Craft Harvest: Live Terpene Masterclass',
      description: 'Exclusive first look at small-batch craft cultivars with master extractors from Hudson Valley Botanics.',
      format: VideoFormat.LIVE_SHOW,
      status: ShowStatus.SCHEDULED,
      scheduledAt: tomorrow,
      scheduledEndAt: tomorrowEnd,
      thumbnailUrl: '/shows/upcoming-drop-thumb.jpg',
      brandId: brand1.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
    },
    create: {
      title: 'Hudson Valley Craft Harvest: Live Terpene Masterclass',
      description: 'Exclusive first look at small-batch craft cultivars with master extractors from Hudson Valley Botanics.',
      format: VideoFormat.LIVE_SHOW,
      status: ShowStatus.SCHEDULED,
      scheduledAt: tomorrow,
      scheduledEndAt: tomorrowEnd,
      thumbnailUrl: '/shows/upcoming-drop-thumb.jpg',
      brandId: brand1.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
      terrificShowId: 'terrific-show-upcoming-002',
    },
  });
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: upcomingShow.id, productId: prod1.id } },
    update: { sortOrder: 1 },
    create: { showId: upcomingShow.id, productId: prod1.id, sortOrder: 1 },
  });

  const replayShow = await prisma.liveShow.upsert({
    where: { terrificShowId: 'terrific-show-replay-003' },
    update: {
      title: 'Empire Terpenes & Live Rosin Showcase (Replay)',
      description: 'Rewatch our premier live drop covering premium solventless rosin and live hash extraction.',
      format: VideoFormat.LIVE_SHOW,
      status: ShowStatus.REPLAY,
      scheduledAt: threeHoursAgo,
      startedAt: threeHoursAgo,
      endedAt: twoHoursAgo,
      thumbnailUrl: '/shows/replay-show-thumb.jpg',
      brandId: brand2.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
    },
    create: {
      title: 'Empire Terpenes & Live Rosin Showcase (Replay)',
      description: 'Rewatch our premier live drop covering premium solventless rosin and live hash extraction.',
      format: VideoFormat.LIVE_SHOW,
      status: ShowStatus.REPLAY,
      scheduledAt: threeHoursAgo,
      startedAt: threeHoursAgo,
      endedAt: twoHoursAgo,
      thumbnailUrl: '/shows/replay-show-thumb.jpg',
      brandId: brand2.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
      terrificShowId: 'terrific-show-replay-003',
    },
  });
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: replayShow.id, productId: prod2.id } },
    update: { sortOrder: 1 },
    create: { showId: replayShow.id, productId: prod2.id, sortOrder: 1 },
  });

  const videoReel1 = await prisma.liveShow.upsert({
    where: { terrificShowId: 'terrific-video-reel-001' },
    update: {
      title: 'Cultivator Spotlight: Sour Diesel Full-Spectrum Resin',
      description: 'Quick 60-second strain deep-dive: pungent diesel terpenes, citrus undertones, and clean vaporization.',
      format: VideoFormat.SHOPPABLE_VIDEO,
      status: ShowStatus.REPLAY,
      thumbnailUrl: '/shows/shoppable-reel-1.jpg',
      brandId: brand1.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
    },
    create: {
      title: 'Cultivator Spotlight: Sour Diesel Full-Spectrum Resin',
      description: 'Quick 60-second strain deep-dive: pungent diesel terpenes, citrus undertones, and clean vaporization.',
      format: VideoFormat.SHOPPABLE_VIDEO,
      status: ShowStatus.REPLAY,
      thumbnailUrl: '/shows/shoppable-reel-1.jpg',
      brandId: brand1.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
      terrificShowId: 'terrific-video-reel-001',
    },
  });
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: videoReel1.id, productId: prod3.id } },
    update: { sortOrder: 1 },
    create: { showId: videoReel1.id, productId: prod3.id, sortOrder: 1 },
  });

  const videoReel2 = await prisma.liveShow.upsert({
    where: { terrificShowId: 'terrific-video-reel-002' },
    update: {
      title: 'Craft Cannabis Unboxing: Gotham Select Sunset Sherbet',
      description: 'Hand-trimmed organic indoor flower. Tap to lock in exclusive Owtlet show pricing.',
      format: VideoFormat.SHOPPABLE_VIDEO,
      status: ShowStatus.REPLAY,
      thumbnailUrl: '/shows/shoppable-reel-2.jpg',
      brandId: brand2.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
    },
    create: {
      title: 'Craft Cannabis Unboxing: Gotham Select Sunset Sherbet',
      description: 'Hand-trimmed organic indoor flower. Tap to lock in exclusive Owtlet show pricing.',
      format: VideoFormat.SHOPPABLE_VIDEO,
      status: ShowStatus.REPLAY,
      thumbnailUrl: '/shows/shoppable-reel-2.jpg',
      brandId: brand2.id,
      embeddingId: 'Cki70GhqvLgWGhJbSxg2',
      terrificShowId: 'terrific-video-reel-002',
    },
  });
  await prisma.showProduct.upsert({
    where: { showId_productId: { showId: videoReel2.id, productId: prod1.id } },
    update: { sortOrder: 1 },
    create: { showId: videoReel2.id, productId: prod1.id, sortOrder: 1 },
  });
  console.log('  ✔ Additional upcoming shows, replays, and shoppable video reels seeded.');

  // 11. Demo Shopper Profile (Optional shopper profile — guest checkout is default)
  console.log('👤 Seeding demo shopper profile with saved address & default store...');
  const shopperPasswordHash = await argon2.hash('shopper_secure_password_2026');
  const shopper = await prisma.shopper.upsert({
    where: { email: 'shopper@owtlet.demo' },
    update: {
      firstName: 'Alex',
      lastName: 'Rivera',
      phone: '212-555-0199',
      homeZip: '10011',
      defaultDispensaryId: gotham.id,
    },
    create: {
      email: 'shopper@owtlet.demo',
      passwordHash: shopperPasswordHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      phone: '212-555-0199',
      homeZip: '10011',
      defaultDispensaryId: gotham.id,
    },
  });

  // Demo Shopper saved address
  await prisma.shopperAddress.deleteMany({
    where: { shopperId: shopper.id },
  });
  await prisma.shopperAddress.create({
    data: {
      shopperId: shopper.id,
      label: 'Home',
      line1: '150 W 18th St',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zip: '10011',
      isDefault: true,
    },
  });
  console.log(`  ✔ Demo shopper created: ${shopper.email} (default store: Gotham Greenery)`);

  console.log('\n🎉 Owtlet seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

