import { prisma } from '../db';
import { calculateDistanceMiles } from '../dispensaries/distance';

export interface VendorHealthSummary {
  dispensaryId: string;
  name: string;
  cartBaseUrl: string | null;
  status: 'OK' | 'UNREACHABLE' | 'MAPPING_GAPS';
  unmappedCount: number;
  lastHealthCheckAt: Date;
  details?: string;
}

export interface VendorHealthCheckReport {
  timestamp: string;
  totalChecked: number;
  healthy: number;
  unreachable: number;
  mappingGaps: number;
  results: VendorHealthSummary[];
}

/**
 * Runs weekly / on-demand health check for all active dispensaries:
 * 1. Checks HEAD / GET to cartBaseUrl with 10s timeout.
 * 2. Counts active catalog products with NO VendorProductMapping.
 * 3. Saves lastHealthCheckAt and healthStatus (OK | UNREACHABLE | MAPPING_GAPS).
 */
export async function runVendorHealthCheck(): Promise<VendorHealthCheckReport> {
  const dispensaries = await prisma.dispensary.findMany({
    where: { isActive: true },
    include: {
      vendorMappings: {
        select: {
          productId: true,
          isAvailable: true,
        },
      },
    },
  });

  const activeProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, sku: true },
  });

  const now = new Date();
  const results: VendorHealthSummary[] = [];

  let healthy = 0;
  let unreachable = 0;
  let mappingGaps = 0;

  for (const dispensary of dispensaries) {
    let status: 'OK' | 'UNREACHABLE' | 'MAPPING_GAPS' = 'OK';
    let details: string | undefined;

    // 1. Check cartBaseUrl reachability
    const targetUrl = dispensary.cartBaseUrl || dispensary.websiteUrl;
    if (targetUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Owtlet-HealthChecker/1.0',
          },
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (!res || !res.ok) {
          status = 'UNREACHABLE';
          details = res ? `HTTP ${res.status}` : 'Connection timed out or network error';
        }
      } catch (err: any) {
        status = 'UNREACHABLE';
        details = err.message;
      }
    } else {
      status = 'UNREACHABLE';
      details = 'No cartBaseUrl or websiteUrl configured';
    }

    // 2. Count active products with NO VendorProductMapping
    const mappedProductIds = new Set(dispensary.vendorMappings.map((m) => m.productId));
    let unmappedCount = 0;

    for (const prod of activeProducts) {
      if (!mappedProductIds.has(prod.id)) {
        unmappedCount++;
      }
    }

    if (status !== 'UNREACHABLE' && unmappedCount > 0) {
      status = 'MAPPING_GAPS';
      details = `${unmappedCount} active catalog products missing mappings`;
    }

    if (status === 'OK') healthy++;
    else if (status === 'UNREACHABLE') unreachable++;
    else if (status === 'MAPPING_GAPS') mappingGaps++;

    // Update dispensary database record
    await prisma.dispensary.update({
      where: { id: dispensary.id },
      data: {
        lastHealthCheckAt: now,
        healthStatus: status,
      },
    });

    results.push({
      dispensaryId: dispensary.id,
      name: dispensary.name,
      cartBaseUrl: targetUrl || null,
      status,
      unmappedCount,
      lastHealthCheckAt: now,
      details,
    });
  }

  return {
    timestamp: now.toISOString(),
    totalChecked: dispensaries.length,
    healthy,
    unreachable,
    mappingGaps,
    results,
  };
}

