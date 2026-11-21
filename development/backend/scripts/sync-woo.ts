import { syncWooProducts } from '../src/server/admin/woocommerce-sync-service';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting WooCommerce Product Sync (Dry Run: ${isDryRun})...`);

  try {
    const report = await syncWooProducts({ dryRun: isDryRun });
    console.log('\n--- Sync Report ---');
    console.log(`Total Processed: ${report.totalProcessed}`);
    console.log(`Created:         ${report.created}`);
    console.log(`Updated:         ${report.updated}`);
    console.log(`Skipped:         ${report.skipped}`);
    console.log(`Errors:          ${report.errors.length}`);
    if (report.errors.length > 0) {
      console.log('Error details:', report.errors);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('WooCommerce Sync failed:', err);
    process.exit(1);
  }
}

main();

