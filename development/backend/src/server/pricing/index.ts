import { Decimal } from '@prisma/client/runtime/library';

export type PriceMode = 'OWTLET' | 'PER_STORE';

/**
 * Formats a money value to USD two-decimal string format (e.g. "45.00")
 */
export function formatMoney(amount: Decimal | number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '0.00';
  }
  const numeric = typeof amount === 'number'
    ? amount
    : typeof amount === 'string'
      ? parseFloat(amount)
      : Number(amount);

  if (isNaN(numeric) || !isFinite(numeric)) {
    return '0.00';
  }
  return numeric.toFixed(2);
}

/**
 * Determines price mode according to REQ-F-015 and ADR-011:
 * - OWTLET: Show product with standardized Owtlet price across all partner dispensaries.
 * - PER_STORE: Catalog product with store-specific retail pricing.
 */
export function determinePriceMode(product: {
  owtletPrice?: Decimal | number | string | null;
}): PriceMode {
  return product.owtletPrice !== null && product.owtletPrice !== undefined
    ? 'OWTLET'
    : 'PER_STORE';
}

/**
 * Resolves the unit price for a product at a specific dispensary:
 * unitPrice(product, inventory) = owtletPrice ?? inventory.price
 */
export function resolveUnitPrice(
  product: { owtletPrice?: Decimal | number | string | null },
  inventory?: { price?: Decimal | number | string | null } | null
): string {
  if (product.owtletPrice !== null && product.owtletPrice !== undefined) {
    return formatMoney(product.owtletPrice);
  }
  if (inventory && inventory.price !== null && inventory.price !== undefined) {
    return formatMoney(inventory.price);
  }
  return '0.00';
}

/**
 * Computes catalog pricing summary:
 * - When owtletPrice is present: priceMode = 'OWTLET', fromPrice = owtletPrice
 * - When per-store: priceMode = 'PER_STORE', fromPrice = min price of in-stock inventories
 */
export function computeCatalogPricing(
  product: { owtletPrice?: Decimal | number | string | null },
  inventories: Array<{
    price?: Decimal | number | string | null;
    stockQty?: number;
  }> = []
): {
  priceMode: PriceMode;
  owtletPrice: string | null;
  fromPrice: string | null;
} {
  const mode = determinePriceMode(product);

  if (mode === 'OWTLET') {
    const formatted = formatMoney(product.owtletPrice);
    return {
      priceMode: 'OWTLET',
      owtletPrice: formatted,
      fromPrice: formatted,
    };
  }

  // Per store mode: find lowest price
  // Prioritize in-stock inventories first
  const inStockWithPrice = inventories.filter(
    (inv) => (inv.stockQty === undefined || inv.stockQty > 0) && inv.price !== null && inv.price !== undefined
  );

  const pool = inStockWithPrice.length > 0
    ? inStockWithPrice
    : inventories.filter((inv) => inv.price !== null && inv.price !== undefined);

  if (pool.length === 0) {
    return {
      priceMode: 'PER_STORE',
      owtletPrice: null,
      fromPrice: null,
    };
  }

  const prices = pool.map((inv) => {
    const val = inv.price;
    return typeof val === 'number' ? val : Number(val);
  }).filter((n) => !isNaN(n));

  if (prices.length === 0) {
    return {
      priceMode: 'PER_STORE',
      owtletPrice: null,
      fromPrice: null,
    };
  }

  const minPrice = Math.min(...prices);
  return {
    priceMode: 'PER_STORE',
    owtletPrice: null,
    fromPrice: formatMoney(minPrice),
  };
}

