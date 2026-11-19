import { prisma } from '../db';

export class AdminInventoryError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminInventoryError';
  }
}

export interface InventoryUpdateItem {
  productId: string;
  dispensaryId: string;
  stockQty: number;
  price?: number | null;
  externalSku?: string | null;
}

export async function listAdminInventory(params?: {
  dispensaryId?: string;
  productId?: string;
}) {
  const where: any = {};
  if (params?.dispensaryId) where.dispensaryId = params.dispensaryId;
  if (params?.productId) where.productId = params.productId;

  const items = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          owtletPrice: true,
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      },
      dispensary: {
        select: {
          id: true,
          name: true,
          slug: true,
          zip: true,
        },
      },
    },
    orderBy: [{ dispensary: { name: 'asc' } }, { product: { name: 'asc' } }],
  });

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    dispensaryId: item.dispensaryId,
    productName: item.product.name,
    productSku: item.product.sku,
    categoryName: item.product.category?.name,
    brandName: item.product.brand?.name,
    dispensaryName: item.dispensary.name,
    dispensaryZip: item.dispensary.zip,
    stockQty: item.stockQty,
    price: item.price ? Number(item.price) : null,
    owtletPrice: item.product.owtletPrice ? Number(item.product.owtletPrice) : null,
    effectivePrice: item.product.owtletPrice
      ? Number(item.product.owtletPrice)
      : item.price
      ? Number(item.price)
      : null,
    externalSku: item.externalSku,
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function bulkUpdateAdminInventory(items: InventoryUpdateItem[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AdminInventoryError('EMPTY_ITEMS', 'Items array is required for bulk inventory update', 400);
  }

  // Validate each item
  for (const item of items) {
    if (!item.productId || !item.dispensaryId) {
      throw new AdminInventoryError(
        'VALIDATION_ERROR',
        'Both productId and dispensaryId are required for every inventory line',
        400
      );
    }
    if (typeof item.stockQty !== 'number' || item.stockQty < 0) {
      throw new AdminInventoryError('VALIDATION_ERROR', 'stockQty must be a non-negative integer', 400);
    }
  }

  const results = await prisma.$transaction(
    items.map((item) => {
      const priceVal =
        item.price !== undefined && item.price !== null
          ? item.price
          : null;

      return prisma.inventory.upsert({
        where: {
          productId_dispensaryId: {
            productId: item.productId,
            dispensaryId: item.dispensaryId,
          },
        },
        create: {
          productId: item.productId,
          dispensaryId: item.dispensaryId,
          stockQty: item.stockQty,
          price: priceVal,
          externalSku: item.externalSku ?? null,
        },
        update: {
          stockQty: item.stockQty,
          price: priceVal,
          externalSku: item.externalSku !== undefined ? item.externalSku : undefined,
        },
      });
    })
  );

  return {
    updatedCount: results.length,
    items: results.map((r) => ({
      id: r.id,
      productId: r.productId,
      dispensaryId: r.dispensaryId,
      stockQty: r.stockQty,
      price: r.price ? Number(r.price) : null,
    })),
  };
}
