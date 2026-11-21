import { prisma } from '../db';

export class AdminMappingError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminMappingError';
  }
}

export interface VendorMappingDto {
  id: string;
  productId: string;
  dispensaryId: string;
  ourSku: string;
  vendorProductId: string | null;
  vendorVariantId: string | null;
  vendorSku: string | null;
  isAvailable: boolean;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    slug: string;
    isActive: boolean;
  };
  dispensary?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface UpsertMappingInput {
  productId: string;
  dispensaryId: string;
  ourSku?: string;
  vendorProductId?: string | null;
  vendorVariantId?: string | null;
  vendorSku?: string | null;
  isAvailable?: boolean;
}

export interface CsvMappingRow {
  our_sku: string;
  dispensary_slug: string;
  vendor_product_id?: string;
  vendor_variant_id?: string;
  vendor_sku?: string;
  is_available?: string | boolean;
}

export interface ImportReportItem {
  row: number;
  ourSku?: string;
  dispensarySlug?: string;
  status: 'CREATED' | 'UPDATED' | 'ERROR';
  message?: string;
}

export interface CsvImportReport {
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; ourSku?: string; dispensarySlug?: string; error: string }>;
  items: ImportReportItem[];
}

export async function listAdminMappings(params: {
  dispensaryId?: string;
  search?: string;
}) {
  const where: any = {};
  if (params.dispensaryId) {
    where.dispensaryId = params.dispensaryId;
  }
  if (params.search) {
    where.OR = [
      { ourSku: { contains: params.search, mode: 'insensitive' } },
      { vendorSku: { contains: params.search, mode: 'insensitive' } },
      { vendorProductId: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const mappings = await prisma.vendorProductMapping.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          slug: true,
          isActive: true,
        },
      },
      dispensary: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { ourSku: 'asc' },
  });

  return mappings.map((m) => ({
    id: m.id,
    productId: m.productId,
    dispensaryId: m.dispensaryId,
    ourSku: m.ourSku,
    vendorProductId: m.vendorProductId,
    vendorVariantId: m.vendorVariantId,
    vendorSku: m.vendorSku,
    isAvailable: m.isAvailable,
    updatedAt: m.updatedAt.toISOString(),
    product: m.product,
    dispensary: m.dispensary,
  }));
}

export async function upsertSingleMapping(data: UpsertMappingInput): Promise<VendorMappingDto> {
  if (!data.productId || !data.dispensaryId) {
    throw new AdminMappingError('VALIDATION_ERROR', 'productId and dispensaryId are required', 400);
  }

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) {
    throw new AdminMappingError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  }

  const dispensary = await prisma.dispensary.findUnique({ where: { id: data.dispensaryId } });
  if (!dispensary) {
    throw new AdminMappingError('DISPENSARY_NOT_FOUND', 'Dispensary not found', 404);
  }

  const ourSku = data.ourSku || product.sku;
  if (!ourSku) {
    throw new AdminMappingError('SKU_REQUIRED', 'Product has no SKU and ourSku was not provided', 400);
  }

  const mapping = await prisma.vendorProductMapping.upsert({
    where: {
      productId_dispensaryId: {
        productId: data.productId,
        dispensaryId: data.dispensaryId,
      },
    },
    update: {
      ourSku,
      vendorProductId: data.vendorProductId !== undefined ? data.vendorProductId : undefined,
      vendorVariantId: data.vendorVariantId !== undefined ? data.vendorVariantId : undefined,
      vendorSku: data.vendorSku !== undefined ? data.vendorSku : undefined,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : undefined,
    },
    create: {
      productId: data.productId,
      dispensaryId: data.dispensaryId,
      ourSku,
      vendorProductId: data.vendorProductId ?? null,
      vendorVariantId: data.vendorVariantId ?? null,
      vendorSku: data.vendorSku ?? null,
      isAvailable: data.isAvailable ?? true,
    },
    include: {
      product: {
        select: { id: true, name: true, sku: true, slug: true, isActive: true },
      },
      dispensary: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return {
    id: mapping.id,
    productId: mapping.productId,
    dispensaryId: mapping.dispensaryId,
    ourSku: mapping.ourSku,
    vendorProductId: mapping.vendorProductId,
    vendorVariantId: mapping.vendorVariantId,
    vendorSku: mapping.vendorSku,
    isAvailable: mapping.isAvailable,
    updatedAt: mapping.updatedAt.toISOString(),
    product: mapping.product,
    dispensary: mapping.dispensary,
  };
}

/**
 * Parses simple CSV content (handling quotes and commas)
 */
export function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Parse header
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s-]+/g, '_'));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] !== undefined ? values[j].replace(/^"|"$/g, '').trim() : '';
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Imports CSV mappings with atomic validation:
 * Validates every row first. If any row is broken, or duplicates in CSV, returns a report.
 * "never partially write a broken row"
 */
export async function importMappingsFromCsv(csvContent: string): Promise<CsvImportReport> {
  const rows = parseCsv(csvContent);

  const report: CsvImportReport = {
    totalRows: rows.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
    items: [],
  };

  if (rows.length === 0) {
    return report;
  }

  // Pre-load all products by SKU and all dispensaries by slug
  const allProducts = await prisma.product.findMany({
    select: { id: true, sku: true, name: true },
  });
  const productSkuMap = new Map<string, { id: string; sku: string }>();
  for (const p of allProducts) {
    if (p.sku) productSkuMap.set(p.sku.toUpperCase(), { id: p.id, sku: p.sku });
  }

  const allDispensaries = await prisma.dispensary.findMany({
    select: { id: true, slug: true, name: true },
  });
  const dispensarySlugMap = new Map<string, { id: string; slug: string }>();
  for (const d of allDispensaries) {
    dispensarySlugMap.set(d.slug.toLowerCase(), { id: d.id, slug: d.slug });
  }

  // Validate each row
  interface ValidatedRow {
    rowNumber: number;
    productId: string;
    dispensaryId: string;
    ourSku: string;
    vendorProductId: string | null;
    vendorVariantId: string | null;
    vendorSku: string | null;
    isAvailable: boolean;
    key: string;
  }

  const validatedRows: ValidatedRow[] = [];
  const seenKeys = new Set<string>();

  for (let idx = 0; idx < rows.length; idx++) {
    const rowNum = idx + 2; // header is row 1
    const raw = rows[idx];

    const ourSku = (raw.our_sku || raw.sku || '').trim();
    const dispensarySlug = (raw.dispensary_slug || raw.dispensary || '').trim().toLowerCase();

    if (!ourSku) {
      report.failed++;
      report.errors.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        error: 'Missing required column: our_sku',
      });
      report.items.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        status: 'ERROR',
        message: 'Missing required column: our_sku',
      });
      continue;
    }

    if (!dispensarySlug) {
      report.failed++;
      report.errors.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        error: 'Missing required column: dispensary_slug',
      });
      report.items.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        status: 'ERROR',
        message: 'Missing required column: dispensary_slug',
      });
      continue;
    }

    const product = productSkuMap.get(ourSku.toUpperCase());
    if (!product) {
      report.failed++;
      report.errors.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        error: `Invalid SKU: product with SKU "${ourSku}" not found`,
      });
      report.items.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        status: 'ERROR',
        message: `Invalid SKU: product with SKU "${ourSku}" not found`,
      });
      continue;
    }

    const dispensary = dispensarySlugMap.get(dispensarySlug);
    if (!dispensary) {
      report.failed++;
      report.errors.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        error: `Unknown dispensary: dispensary with slug "${dispensarySlug}" not found`,
      });
      report.items.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        status: 'ERROR',
        message: `Unknown dispensary: dispensary with slug "${dispensarySlug}" not found`,
      });
      continue;
    }

    // Check duplicate rows within the CSV file
    const pairKey = `${product.id}:::${dispensary.id}`;
    if (seenKeys.has(pairKey)) {
      report.failed++;
      report.errors.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        error: `Duplicate row in CSV for SKU "${ourSku}" and dispensary "${dispensarySlug}"`,
      });
      report.items.push({
        row: rowNum,
        ourSku,
        dispensarySlug,
        status: 'ERROR',
        message: `Duplicate row in CSV for SKU "${ourSku}" and dispensary "${dispensarySlug}"`,
      });
      continue;
    }
    seenKeys.add(pairKey);

    const isAvailableRaw = raw.is_available !== undefined ? String(raw.is_available).toLowerCase() : 'true';
    const isAvailable = isAvailableRaw !== 'false' && isAvailableRaw !== '0';

    validatedRows.push({
      rowNumber: rowNum,
      productId: product.id,
      dispensaryId: dispensary.id,
      ourSku: product.sku,
      vendorProductId: raw.vendor_product_id?.trim() || null,
      vendorVariantId: raw.vendor_variant_id?.trim() || null,
      vendorSku: raw.vendor_sku?.trim() || null,
      isAvailable,
      key: pairKey,
    });
  }

  // If ANY row in the CSV failed validation, do NOT write any broken rows!
  if (report.failed > 0) {
    return report;
  }

  // Pre-load existing mappings to know which are CREATED vs UPDATED
  const existingMappings = await prisma.vendorProductMapping.findMany({
    select: { productId: true, dispensaryId: true },
  });
  const existingSet = new Set(existingMappings.map((m) => `${m.productId}:::${m.dispensaryId}`));

  // Execute database writes inside a transaction
  await prisma.$transaction(async (tx) => {
    for (const vRow of validatedRows) {
      const isUpdate = existingSet.has(vRow.key);
      await tx.vendorProductMapping.upsert({
        where: {
          productId_dispensaryId: {
            productId: vRow.productId,
            dispensaryId: vRow.dispensaryId,
          },
        },
        update: {
          ourSku: vRow.ourSku,
          vendorProductId: vRow.vendorProductId,
          vendorVariantId: vRow.vendorVariantId,
          vendorSku: vRow.vendorSku,
          isAvailable: vRow.isAvailable,
        },
        create: {
          productId: vRow.productId,
          dispensaryId: vRow.dispensaryId,
          ourSku: vRow.ourSku,
          vendorProductId: vRow.vendorProductId,
          vendorVariantId: vRow.vendorVariantId,
          vendorSku: vRow.vendorSku,
          isAvailable: vRow.isAvailable,
        },
      });

      if (isUpdate) {
        report.updated++;
        report.items.push({
          row: vRow.rowNumber,
          ourSku: vRow.ourSku,
          status: 'UPDATED',
        });
      } else {
        report.created++;
        report.items.push({
          row: vRow.rowNumber,
          ourSku: vRow.ourSku,
          status: 'CREATED',
        });
      }
    }
  });

  return report;
}

