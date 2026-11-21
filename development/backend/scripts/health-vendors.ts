import { runVendorHealthCheck } from '../src/server/admin/vendor-health-service';

async function main() {
  console.log('Running Vendor Health Check...');
  try {
    const report = await runVendorHealthCheck();
    console.log('\n--- Vendor Health Report ---');
    console.log(`Total Checked: ${report.totalChecked}`);
    console.log(`Healthy:       ${report.healthy}`);
    console.log(`Unreachable:   ${report.unreachable}`);
    console.log(`Mapping Gaps:  ${report.mappingGaps}`);
    for (const res of report.results) {
      console.log(`- ${res.name} (${res.status}): ${res.unmappedCount} unmapped products ${res.details ? `[${res.details}]` : ''}`);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('Vendor Health Check failed:', err);
    process.exit(1);
  }
}

main();

