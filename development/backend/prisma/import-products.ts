import { PrismaClient, StrainType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export interface ProductImportRecord {
  name: string;
  slug?: string;
  description?: string;
  categorySlug: string;
  strainName?: string;
  strainType?: StrainType;
  brandSlug: string;
  thcPercent?: number;
  cbdPercent?: number;
  weightGrams?: number;
  imageUrls?: string[];
  owtletPrice?: number;
  sku?: string;
  terrificProductId?: string;
  externalId?: string;
  inventories?: Array<{
    dispensarySlug: string;
    price?: number;
    stockQty: number;
  }>;
}

export interface ImportOptions {
  dryRun?: boolean;
  archiveLegacyTest?: boolean;
}

export async function importProducts(
  records: ProductImportRecord[],
  options: ImportOptions = {}
) {
  const { dryRun = false, archiveLegacyTest = false } = options;

  console.log(`\n🌿 [Owtlet Product Import Engine - Backend] Starting import...`);
  console.log(`ℹ Records to process: ${records.length}`);
  console.log(`ℹ Dry-run mode: ${dryRun ? 'YES (No database writes)' : 'NO (Applying changes)'}`);
  console.log(`ℹ Archive test products: ${archiveLegacyTest ? 'YES' : 'NO'}\n`);

  if (records.length === 0) {
    console.log('⚠️ No records provided to import.');
    return { processed: 0, imported: 0, errors: [] };
  }

  // Pre-validate records
  const validationErrors: Array<{ index: number; name?: string; error: string }> = [];
  records.forEach((rec, idx) => {
    if (!rec.name) validationErrors.push({ index: idx, error: 'Product name is required' });
    if (!rec.categorySlug) validationErrors.push({ index: idx, name: rec.name, error: 'categorySlug is required' });
    if (!rec.brandSlug) validationErrors.push({ index: idx, name: rec.name, error: 'brandSlug is required' });
  });

  if (validationErrors.length > 0) {
    console.error(`❌ Validation failed with ${validationErrors.length} errors:`);
    validationErrors.forEach((e) => console.error(`  - Row ${e.index} (${e.name || 'unnamed'}): ${e.error}`));
    if (dryRun) {
      return { processed: records.length, imported: 0, errors: validationErrors };
    }
    throw new Error(`Import validation failed with ${validationErrors.length} errors.`);
  }

  console.log(`✔ Pre-validation passed for all ${records.length} records.`);

  if (dryRun) {
    console.log(`\n🔎 Dry-run analysis:`);
    records.forEach((rec, i) => {
      console.log(`  [${i + 1}/${records.length}] ${rec.name} | Category: ${rec.categorySlug} | Brand: ${rec.brandSlug} | Inventories: ${rec.inventories?.length ?? 0}`);
    });
    console.log(`\n✅ Dry-run completed successfully. All records are valid.`);
    return { processed: records.length, imported: records.length, errors: [] };
  }

  try {
    if (archiveLegacyTest) {
      console.log('📦 Archiving legacy test products...');
      const archived = await prisma.product.updateMany({
        where: { shopifyLegacyId: { not: null }, isActive: true },
        data: { isActive: false },
      });
      console.log(`✔ Archived ${archived.count} test products.`);
    }

    let importedCount = 0;

    for (const rec of records) {
      const slug = rec.slug || rec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const sku = rec.sku || `SKU-${slug.toUpperCase()}`;

      const category = await prisma.category.findUnique({
        where: { slug: rec.categorySlug },
      });
      if (!category) {
        console.warn(`⚠️ Category '${rec.categorySlug}' not found in DB. Skipping ${rec.name}.`);
        continue;
      }

      const brand = await prisma.brand.findUnique({
        where: { slug: rec.brandSlug },
      });
      if (!brand) {
        console.warn(`⚠️ Brand '${rec.brandSlug}' not found in DB. Skipping ${rec.name}.`);
        continue;
      }

      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          name: rec.name,
          description: rec.description || '',
          categoryId: category.id,
          brandId: brand.id,
          thcPercent: rec.thcPercent,
          cbdPercent: rec.cbdPercent,
          weightGrams: rec.weightGrams,
          imageUrls: rec.imageUrls || [],
          owtletPrice: rec.owtletPrice,
          sku,
          terrificProductId: rec.terrificProductId,
          externalId: rec.externalId,
          isActive: true,
        },
        create: {
          name: rec.name,
          slug,
          description: rec.description || '',
          categoryId: category.id,
          brandId: brand.id,
          thcPercent: rec.thcPercent,
          cbdPercent: rec.cbdPercent,
          weightGrams: rec.weightGrams,
          imageUrls: rec.imageUrls || [],
          owtletPrice: rec.owtletPrice,
          sku,
          terrificProductId: rec.terrificProductId,
          externalId: rec.externalId,
          isActive: true,
        },
      });

      if (rec.inventories && rec.inventories.length > 0) {
        for (const inv of rec.inventories) {
          const dispensary = await prisma.dispensary.findUnique({
            where: { slug: inv.dispensarySlug },
          });

          if (dispensary) {
            await prisma.inventory.upsert({
              where: {
                productId_dispensaryId: {
                  productId: product.id,
                  dispensaryId: dispensary.id,
                },
              },
              update: {
                price: inv.price,
                stockQty: inv.stockQty,
                isAvailable: inv.stockQty > 0,
              },
              create: {
                productId: product.id,
                dispensaryId: dispensary.id,
                price: inv.price,
                stockQty: inv.stockQty,
                isAvailable: inv.stockQty > 0,
              },
            });
          }
        }
      }

      importedCount++;
    }

    console.log(`\n🎉 Successfully imported ${importedCount} products into PostgreSQL.`);
    return { processed: records.length, imported: importedCount, errors: [] };
  } catch (err) {
    console.error('❌ Error during import execution:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const archiveLegacyTest = args.includes('--archive-test');

  const fileArg = args.find((a) => a.startsWith('--file='));
  let records: ProductImportRecord[] = [];

  if (fileArg) {
    const filePath = path.resolve(fileArg.split('=')[1]);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      records = JSON.parse(content);
    } else {
      console.error(`❌ Specified file not found: ${filePath}`);
      process.exit(1);
    }
  } else {
    records = [
      {
        name: 'Hudson Valley Blue Dream Flower 3.5g',
        slug: 'hudson-valley-blue-dream-3-5g',
        description: 'Locally grown premium NY craft flower with sweet berry terpene profile.',
        categorySlug: 'flower',
        brandSlug: 'hudson-valley-botanics',
        strainType: StrainType.HYBRID,
        thcPercent: 24.5,
        cbdPercent: 0.1,
        weightGrams: 3.5,
        imageUrls: ['/products/flower-blue-dream.jpg'],
        owtletPrice: 48.0,
        sku: 'HVB-BD-35G',
        inventories: [
          { dispensarySlug: 'gotham-greenery', price: 50.0, stockQty: 40 },
          { dispensarySlug: 'kings-county', price: 48.0, stockQty: 25 },
        ],
      },
    ];
  }

  importProducts(records, { dryRun, archiveLegacyTest })
    .then((result) => {
      console.log(`\nImport script finished. Processed: ${result.processed}, Imported: ${result.imported}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal import error:', err);
      process.exit(1);
    });
}

