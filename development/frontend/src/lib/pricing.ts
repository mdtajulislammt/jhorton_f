export type PriceMode = 'OWTLET' | 'PER_STORE';

export function formatMoney(amount: number | string | null | undefined): string {
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

export function determinePriceMode(product: {
  owtletPrice?: number | string | null;
}): PriceMode {
  return product.owtletPrice !== null && product.owtletPrice !== undefined
    ? 'OWTLET'
    : 'PER_STORE';
}

export function resolveUnitPrice(
  product: { owtletPrice?: number | string | null },
  inventory?: { price?: number | string | null } | null
): string {
  if (product.owtletPrice !== null && product.owtletPrice !== undefined) {
    return formatMoney(product.owtletPrice);
  }
  if (inventory && inventory.price !== null && inventory.price !== undefined) {
    return formatMoney(inventory.price);
  }
  return '0.00';
}

export function computeCatalogPricing(
  product: { owtletPrice?: number | string | null },
  inventories: Array<{
    price?: number | string | null;
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
