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

  // 5. Dispensaries (10 Real NY Licensed Partners)
  console.log('🏪 Seeding 10 real partner dispensaries...');

  const dispensariesData = [
    // 1. Cannablooms – 2400 N Ocean Ave, Farmingville, NY 11738
    {
      name: 'Cannablooms',
      slug: 'cannablooms',
      licenseNumber: 'OCM-CAURD-2023-00101',
      addressLine1: '2400 N Ocean Ave',
      city: 'Farmingville',
      state: 'NY',
      zip: '11738',
      latitude: 40.828305,
      longitude: -73.021118,
      websiteUrl: 'https://cannablooms.com/',
      offersPickup: true,
      offersDelivery: true,
      coverageZips: ['11738', '11701', '11706', '11710', '11714', '11722', '11735', '11743', '11746', '11747', '11753', '11756', '11758', '11762', '11783', '11788', '11791', '11797'],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://cannablooms.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_cannablooms_key',
      hours: [
        // Store: Sun–Thu 8AM–12AM (08:00 - 00:00), Fri–Sat 8AM–1AM (08:00 - 01:00)
        // Delivery: daily 12PM–8PM (12:00 - 20:00)
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '08:00',
          closesAt: day === 5 || day === 6 ? '01:00' : '00:00',
          isClosed: false,
        })),
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
          opensAt: '12:00',
          closesAt: '20:00',
          isClosed: false,
        })),
      ],
    },
    // 2. Culture House – 807 Manhattan Ave, Brooklyn, NY 11222
    {
      name: 'Culture House',
      slug: 'culture-house',
      licenseNumber: 'OCM-CAURD-2023-00102',
      addressLine1: '807 Manhattan Ave',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11222',
      latitude: 40.727962,
      longitude: -73.953311,
      websiteUrl: 'https://culturehousenyc.com/',
      offersPickup: true,
      offersDelivery: true,
      coverageZips: ['11201', '11205', '11206', '11211', '11222', '11249', '11101', '11102', '11106', '11385'],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://culturehousenyc.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_culture_house_key',
      hours: [
        // Store: Sun 9AM–10PM, Mon–Sat 9AM–11PM
        // Delivery: daily 12PM–8PM
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '09:00',
          closesAt: day === 0 ? '22:00' : '23:00',
          isClosed: false,
        })),
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
          opensAt: '12:00',
          closesAt: '20:00',
          isClosed: false,
        })),
      ],
    },
    // 3. Herbwell – 372 E Fordham Rd, Bronx, NY 10458 (no delivery listed)
    {
      name: 'Herbwell',
      slug: 'herbwell',
      licenseNumber: 'OCM-CAURD-2023-00103',
      addressLine1: '372 E Fordham Rd',
      city: 'Bronx',
      state: 'NY',
      zip: '10458',
      latitude: 40.861696,
      longitude: -73.892352,
      websiteUrl: 'https://herbwellcannabis.com/',
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://herbwellcannabis.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_herbwell_key',
      hours: [
        // Store: Sun 9AM–8:30PM, Mon–Wed 9AM–9:30PM, Thu–Sat 9AM–10:30PM
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '09:00',
          closesAt: day === 0 ? '20:30' : (day === 1 || day === 2 || day === 3 ? '21:30' : '22:30'),
          isClosed: false,
        })),
      ],
    },
    // 4. Kings House of Fire – 3006 E Main St, Cortlandt Manor, NY 10567 (no delivery listed)
    {
      name: 'Kings House of Fire',
      slug: 'kings-house-of-fire',
      licenseNumber: 'OCM-CAURD-2023-00104',
      addressLine1: '3006 E Main St',
      city: 'Cortlandt Manor',
      state: 'NY',
      zip: '10567',
      latitude: 41.306714,
      longitude: -73.878338,
      websiteUrl: 'https://www.kingshouseoffire.com/',
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://www.kingshouseoffire.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_kings_house_of_fire_key',
      hours: [
        // Store: Sun 10AM–6PM, Mon–Sat 9AM–9PM
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: day === 0 ? '10:00' : '09:00',
          closesAt: day === 0 ? '18:00' : '21:00',
          isClosed: false,
        })),
      ],
    },
    // 5. Nicklz – 797 8th Ave, New York, NY 10019
    {
      name: 'Nicklz',
      slug: 'nicklz',
      licenseNumber: 'OCM-CAURD-2023-00105',
      addressLine1: '797 8th Ave',
      city: 'New York',
      state: 'NY',
      zip: '10019',
      latitude: 40.761297,
      longitude: -73.986949,
      websiteUrl: 'https://nicklzny.com/',
      offersPickup: true,
      offersDelivery: true,
      coverageZips: ['10001', '10002', '10003', '10011', '10012', '10013', '10014', '10016', '10018', '10019', '10020', '10021', '10022', '10023', '10024', '10025', '10028', '10036'],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://nicklzny.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_nicklz_key',
      hours: [
        // Store: Sun–Wed 10AM–11PM, Thu–Sat 10AM–12AM (10:00 - 00:00)
        // Delivery: daily 2PM–10PM (14:00 - 22:00)
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '10:00',
          closesAt: day === 4 || day === 5 || day === 6 ? '00:00' : '23:00',
          isClosed: false,
        })),
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
          opensAt: '14:00',
          closesAt: '22:00',
          isClosed: false,
        })),
      ],
    },
    // 6. QUBE – 1412 Broadway, New York, NY 10018 (no delivery listed)
    {
      name: 'QUBE',
      slug: 'qube',
      licenseNumber: 'OCM-CAURD-2023-00106',
      addressLine1: '1412 Broadway',
      city: 'New York',
      state: 'NY',
      zip: '10018',
      latitude: 40.753789,
      longitude: -73.986833,
      websiteUrl: 'https://qubenyc.com/',
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://qubenyc.com/order?ref={subOrderId}',
      webhookSecret: 'whsec_qube_key',
      hours: [
        // Store: every day 8AM–2AM (08:00 - 02:00) (TODO: confirm, source says "Sun - Mon")
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '08:00',
          closesAt: '02:00',
          isClosed: false,
        })),
      ],
    },
    // 7. Terp Bros (Astoria) – 36-10 Ditmars Blvd, Astoria, NY 11105
    {
      name: 'Terp Bros (Astoria)',
      slug: 'terp-bros-astoria',
      licenseNumber: 'OCM-CAURD-2023-00107',
      addressLine1: '36-10 Ditmars Blvd',
      city: 'Astoria',
      state: 'NY',
      zip: '11105',
      latitude: 40.774031,
      longitude: -73.907974,
      websiteUrl: 'https://terpbrosnyc.com/',
      offersPickup: true,
      offersDelivery: true,
      coverageZips: ['11101', '11102', '11103', '11105', '11106', '11370', '11372', '11377', '11378'],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://terpbrosnyc.com/astoria/order?ref={subOrderId}',
      webhookSecret: 'whsec_terp_bros_astoria_key',
      hours: [
        // Store: Sun–Wed 8AM–10PM, Thu–Sat 8AM–11PM
        // Delivery: Sun–Wed 10AM–8:45PM (10:00 - 20:45), Thu–Sat 10AM–9:45PM (10:00 - 21:45)
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '08:00',
          closesAt: day === 4 || day === 5 || day === 6 ? '23:00' : '22:00',
          isClosed: false,
        })),
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
          opensAt: '10:00',
          closesAt: day === 4 || day === 5 || day === 6 ? '21:45' : '20:45',
          isClosed: false,
        })),
      ],
    },
    // 8. Terp Bros (Ozone Park) – 135-26 Cross Bay Blvd, Ozone Park, NY 11417
    {
      name: 'Terp Bros (Ozone Park)',
      slug: 'terp-bros-ozone-park',
      licenseNumber: 'OCM-CAURD-2023-00108',
      addressLine1: '135-26 Cross Bay Blvd',
      city: 'Ozone Park',
      state: 'NY',
      zip: '11417',
      latitude: 40.672937,
      longitude: -73.843690,
      websiteUrl: 'https://terpbrosnyc.com/',
      offersPickup: true,
      offersDelivery: true,
      coverageZips: ['11414', '11416', '11417', '11418', '11419', '11420', '11421', '11374', '11375', '11379', '11385'],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://terpbrosnyc.com/ozone-park/order?ref={subOrderId}',
      webhookSecret: 'whsec_terp_bros_ozone_park_key',
      hours: [
        // Store: Sun–Wed 8AM–10PM, Thu–Sat 8AM–11PM
        // Delivery: Sun–Wed 10AM–9PM, Thu–Sat 10AM–10PM
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '08:00',
          closesAt: day === 4 || day === 5 || day === 6 ? '23:00' : '22:00',
          isClosed: false,
        })),
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.DELIVERY,
          dayOfWeek: day,
          opensAt: '10:00',
          closesAt: day === 4 || day === 5 || day === 6 ? '22:00' : '21:00',
          isClosed: false,
        })),
      ],
    },
    // 9. Zen Zest (Staten Island) – 2343 Forest Ave, Store #3, Staten Island, NY 10303 (no delivery listed)
    {
      name: 'Zen Zest (Staten Island)',
      slug: 'zen-zest-staten-island',
      licenseNumber: 'OCM-CAURD-2023-00109',
      addressLine1: '2343 Forest Ave, Store #3',
      city: 'Staten Island',
      state: 'NY',
      zip: '10303',
      latitude: 40.628677,
      longitude: -74.167143,
      websiteUrl: 'https://zenzest.com/staten-island/',
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://zenzest.com/staten-island/order?ref={subOrderId}',
      webhookSecret: 'whsec_zen_zest_si_key',
      hours: [
        // Store: Sun 9AM–8PM, Mon–Thu 9AM–10PM, Fri–Sat 9AM–11PM
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '09:00',
          closesAt: day === 0 ? '20:00' : (day === 5 || day === 6 ? '23:00' : '22:00'),
          isClosed: false,
        })),
      ],
    },
    // 10. Zen Zest (Nassau) – 272-06 Union Turnpike, Queens, NY 11040 (no delivery listed)
    {
      name: 'Zen Zest (Nassau)',
      slug: 'zen-zest-nassau',
      licenseNumber: 'OCM-CAURD-2023-00110',
      addressLine1: '272-06 Union Turnpike',
      city: 'Queens',
      state: 'NY',
      zip: '11040',
      latitude: 40.752076,
      longitude: -73.701828,
      websiteUrl: 'https://zenzest.com/queens',
      offersPickup: true,
      offersDelivery: false,
      coverageZips: [],
      timezone: 'America/New_York',
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrlTemplate: 'https://zenzest.com/queens/order?ref={subOrderId}',
      webhookSecret: 'whsec_zen_zest_nassau_key',
      hours: [
        // Store: Sun 9AM–10PM, Mon–Tue 9AM–12AM (09:00 - 00:00), Wed–Fri 9AM–2AM (09:00 - 02:00), Sat 9AM–12AM (09:00 - 00:00)
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({
          kind: HoursKind.STORE,
          dayOfWeek: day,
          opensAt: '09:00',
          closesAt: day === 0 ? '22:00' : (day === 3 || day === 4 || day === 5 ? '02:00' : '00:00'),
          isClosed: false,
        })),
      ],
    },
  ];

  const dispensaryMap: Record<string, string> = {};

  for (const disp of dispensariesData) {
    const record = await prisma.dispensary.upsert({
      where: { slug: disp.slug },
      update: {
        name: disp.name,
        licenseNumber: disp.licenseNumber,
        addressLine1: disp.addressLine1,
        city: disp.city,
        state: disp.state,
        zip: disp.zip,
        latitude: disp.latitude,
        longitude: disp.longitude,
        websiteUrl: disp.websiteUrl,
        offersPickup: disp.offersPickup,
        offersDelivery: disp.offersDelivery,
        coverageZips: disp.coverageZips,
        timezone: disp.timezone,
        handoffChannel: disp.handoffChannel,
        handoffUrlTemplate: disp.handoffUrlTemplate,
        webhookSecret: disp.webhookSecret,
        isActive: true,
      },
      create: {
        name: disp.name,
        slug: disp.slug,
        licenseNumber: disp.licenseNumber,
        addressLine1: disp.addressLine1,
        city: disp.city,
        state: disp.state,
        zip: disp.zip,
        latitude: disp.latitude,
        longitude: disp.longitude,
        websiteUrl: disp.websiteUrl,
        offersPickup: disp.offersPickup,
        offersDelivery: disp.offersDelivery,
        coverageZips: disp.coverageZips,
        timezone: disp.timezone,
        handoffChannel: disp.handoffChannel,
        handoffUrlTemplate: disp.handoffUrlTemplate,
        webhookSecret: disp.webhookSecret,
        isActive: true,
      },
    });

    dispensaryMap[disp.slug] = record.id;

    // Seed hours for this dispensary
    for (const h of disp.hours) {
      await prisma.dispensaryHours.upsert({
        where: {
          dispensaryId_kind_dayOfWeek: {
            dispensaryId: record.id,
            kind: h.kind,
            dayOfWeek: h.dayOfWeek,
          },
        },
        update: {
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        },
        create: {
          dispensaryId: record.id,
          kind: h.kind,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        },
      });
    }
  }

  console.log(`  ✔ Seeded ${dispensariesData.length} real partner dispensaries and their hours.`);

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

  // Assign brands to all partner dispensaries so products are available across NY regions
  for (const disp of dispensariesData) {
    const dispId = dispensaryMap[disp.slug];
    await prisma.brandDispensary.upsert({
      where: { brandId_dispensaryId: { brandId: brand1.id, dispensaryId: dispId } },
      update: {},
      create: { brandId: brand1.id, dispensaryId: dispId },
    });
    await prisma.brandDispensary.upsert({
      where: { brandId_dispensaryId: { brandId: brand2.id, dispensaryId: dispId } },
      update: {},
      create: { brandId: brand2.id, dispensaryId: dispId },
    });
  }
  console.log('  ✔ Brands & BrandDispensary partner mappings created for all 10 dispensaries.');

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
  // Stock all products across the new partner dispensaries
  for (const disp of dispensariesData) {
    const dispId = dispensaryMap[disp.slug];

    // Show products (prod1, prod2, prod3) have owtletPrice
    await prisma.inventory.upsert({
      where: { productId_dispensaryId: { productId: prod1.id, dispensaryId: dispId } },
      update: { stockQty: 45, price: null },
      create: { productId: prod1.id, dispensaryId: dispId, stockQty: 45, price: null },
    });
    await prisma.inventory.upsert({
      where: { productId_dispensaryId: { productId: prod2.id, dispensaryId: dispId } },
      update: { stockQty: 30, price: null },
      create: { productId: prod2.id, dispensaryId: dispId, stockQty: 30, price: null },
    });
    await prisma.inventory.upsert({
      where: { productId_dispensaryId: { productId: prod3.id, dispensaryId: dispId } },
      update: { stockQty: 50, price: null },
      create: { productId: prod3.id, dispensaryId: dispId, stockQty: 50, price: null },
    });

    // Catalog products with per-store prices
    await prisma.inventory.upsert({
      where: { productId_dispensaryId: { productId: prod4.id, dispensaryId: dispId } },
      update: { stockQty: 35, price: 32.00 },
      create: { productId: prod4.id, dispensaryId: dispId, stockQty: 35, price: 32.00 },
    });
    await prisma.inventory.upsert({
      where: { productId_dispensaryId: { productId: prod5.id, dispensaryId: dispId } },
      update: { stockQty: 20, price: 60.00 },
      create: { productId: prod5.id, dispensaryId: dispId, stockQty: 20, price: 60.00 },
    });
  }
  console.log('  ✔ Store inventory stocked across all 10 partner dispensaries.');

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
  const defaultStoreId = dispensaryMap['nicklz'] || Object.values(dispensaryMap)[0];
  const shopperPasswordHash = await argon2.hash('shopper_secure_password_2026');
  const shopper = await prisma.shopper.upsert({
    where: { email: 'shopper@owtlet.demo' },
    update: {
      firstName: 'Alex',
      lastName: 'Rivera',
      phone: '212-555-0199',
      homeZip: '10019',
      defaultDispensaryId: defaultStoreId,
    },
    create: {
      email: 'shopper@owtlet.demo',
      passwordHash: shopperPasswordHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      phone: '212-555-0199',
      homeZip: '10019',
      defaultDispensaryId: defaultStoreId,
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
      line1: '797 8th Ave',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zip: '10019',
      isDefault: true,
    },
  });
  console.log(`  ✔ Demo shopper created: ${shopper.email} (default store: Nicklz)`);

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

