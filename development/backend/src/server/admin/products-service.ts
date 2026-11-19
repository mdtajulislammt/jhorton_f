import { prisma } from '../db';

export class AdminProductError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminProductError';
  }
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  brandId?: string | null;
  categoryId: string;
  strainId?: string | null;
  thcPercent?: number | null;
  cbdPercent?: number | null;
  weightGrams?: number | null;
  imageUrls?: string[];
  owtletPrice?: number | null;
  sku?: string | null;
  terrificProductId?: string | null;
  isActive?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listAdminProducts(params?: {
  search?: string;
  brandId?: string;
  categoryId?: string;
  isActive?: boolean;
}) {
  const where: any = {};

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params?.brandId) where.brandId = params.brandId;
  if (params?.categoryId) where.categoryId = params.categoryId;
  if (params?.isActive !== undefined) where.isActive = params.isActive;

  const products = await prisma.product.findMany({
    where,
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
      strain: { select: { id: true, name: true, type: true } },
      inventory: {
        select: {
          id: true,
          dispensaryId: true,
          stockQty: true,
          price: true,
          dispensary: { select: { name: true } },
        },
      },
      showProducts: {
        include: {
          show: { select: { id: true, title: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => {
    const totalStock = p.inventory.reduce((sum, inv) => sum + inv.stockQty, 0);
    const isPinnedInActiveShow = p.showProducts.some(
      (sp) => sp.show.status === 'LIVE' || sp.show.status === 'SCHEDULED'
    );

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      brandId: p.brandId,
      brand: p.brand,
      categoryId: p.categoryId,
      category: p.category,
      strainId: p.strainId,
      strain: p.strain,
      thcPercent: p.thcPercent ? Number(p.thcPercent) : null,
      cbdPercent: p.cbdPercent ? Number(p.cbdPercent) : null,
      weightGrams: p.weightGrams ? Number(p.weightGrams) : null,
      imageUrls: p.imageUrls,
      owtletPrice: p.owtletPrice ? Number(p.owtletPrice) : null,
      sku: p.sku,
      terrificProductId: p.terrificProductId,
      isActive: p.isActive,
      totalStock,
      inventoryCount: p.inventory.length,
      isPinnedInActiveShow,
      pinnedShows: p.showProducts.map((sp) => ({
        id: sp.show.id,
        title: sp.show.title,
        status: sp.show.status,
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });
}

export async function getAdminProductById(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      strain: true,
      inventory: {
        include: {
          dispensary: { select: { id: true, name: true } },
        },
      },
      showProducts: {
        include: {
          show: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!p) {
    throw new AdminProductError('NOT_FOUND', 'Product not found', 404);
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brandId: p.brandId,
    brand: p.brand,
    categoryId: p.categoryId,
    category: p.category,
    strainId: p.strainId,
    strain: p.strain,
    thcPercent: p.thcPercent ? Number(p.thcPercent) : null,
    cbdPercent: p.cbdPercent ? Number(p.cbdPercent) : null,
    weightGrams: p.weightGrams ? Number(p.weightGrams) : null,
    imageUrls: p.imageUrls,
    owtletPrice: p.owtletPrice ? Number(p.owtletPrice) : null,
    sku: p.sku,
    terrificProductId: p.terrificProductId,
    isActive: p.isActive,
    inventory: p.inventory.map((inv) => ({
      id: inv.id,
      dispensaryId: inv.dispensaryId,
      dispensaryName: inv.dispensary.name,
      stockQty: inv.stockQty,
      price: inv.price ? Number(inv.price) : null,
    })),
    pinnedShows: p.showProducts.map((sp) => ({
      id: sp.show.id,
      title: sp.show.title,
      status: sp.show.status,
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function createAdminProduct(data: CreateProductInput) {
  if (!data.name || !data.categoryId) {
    throw new AdminProductError('VALIDATION_ERROR', 'Name and category are required', 400);
  }

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  // Check unique slug
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    throw new AdminProductError('SLUG_TAKEN', `Product with slug "${slug}" already exists`, 409);
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      brandId: data.brandId ?? null,
      categoryId: data.categoryId,
      strainId: data.strainId ?? null,
      thcPercent: data.thcPercent !== undefined && data.thcPercent !== null ? data.thcPercent : null,
      cbdPercent: data.cbdPercent !== undefined && data.cbdPercent !== null ? data.cbdPercent : null,
      weightGrams: data.weightGrams !== undefined && data.weightGrams !== null ? data.weightGrams : null,
      imageUrls: data.imageUrls || [],
      owtletPrice: data.owtletPrice !== undefined && data.owtletPrice !== null ? data.owtletPrice : null,
      sku: data.sku ?? null,
      terrificProductId: data.terrificProductId ?? null,
      isActive: data.isActive ?? true,
    },
    include: {
      brand: true,
      category: true,
      strain: true,
    },
  });

  return {
    ...product,
    thcPercent: product.thcPercent ? Number(product.thcPercent) : null,
    cbdPercent: product.cbdPercent ? Number(product.cbdPercent) : null,
    weightGrams: product.weightGrams ? Number(product.weightGrams) : null,
    owtletPrice: product.owtletPrice ? Number(product.owtletPrice) : null,
  };
}

export async function updateAdminProduct(id: string, data: UpdateProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      showProducts: {
        include: {
          show: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!existing) {
    throw new AdminProductError('NOT_FOUND', 'Product not found', 404);
  }

  // Acceptance Invariant: If product is pinned in an active/scheduled live show,
  // owtletPrice CANNOT be removed (must remain set)
  const isPinned = existing.showProducts.some(
    (sp) => sp.show.status === 'LIVE' || sp.show.status === 'SCHEDULED'
  );

  if (isPinned && (data.owtletPrice === null || (data.owtletPrice === undefined && !existing.owtletPrice))) {
    throw new AdminProductError(
      'PRICE_REQUIRED',
      'Cannot remove Owtlet price: product is currently pinned in a scheduled or active live show (AC-ADM-01)',
      422
    );
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = slugify(data.slug);
  if (data.description !== undefined) updateData.description = data.description;
  if (data.brandId !== undefined) updateData.brandId = data.brandId;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.strainId !== undefined) updateData.strainId = data.strainId;
  if (data.thcPercent !== undefined) updateData.thcPercent = data.thcPercent;
  if (data.cbdPercent !== undefined) updateData.cbdPercent = data.cbdPercent;
  if (data.weightGrams !== undefined) updateData.weightGrams = data.weightGrams;
  if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;
  if (data.owtletPrice !== undefined) updateData.owtletPrice = data.owtletPrice;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.terrificProductId !== undefined) updateData.terrificProductId = data.terrificProductId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      brand: true,
      category: true,
      strain: true,
    },
  });

  return {
    ...updated,
    thcPercent: updated.thcPercent ? Number(updated.thcPercent) : null,
    cbdPercent: updated.cbdPercent ? Number(updated.cbdPercent) : null,
    weightGrams: updated.weightGrams ? Number(updated.weightGrams) : null,
    owtletPrice: updated.owtletPrice ? Number(updated.owtletPrice) : null,
  };
}

export async function deleteAdminProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      showProducts: {
        include: { show: true },
      },
    },
  });

  if (!existing) {
    throw new AdminProductError('NOT_FOUND', 'Product not found', 404);
  }

  const isPinned = existing.showProducts.some(
    (sp) => sp.show.status === 'LIVE' || sp.show.status === 'SCHEDULED'
  );

  if (isPinned) {
    throw new AdminProductError(
      'PRODUCT_IN_USE',
      'Cannot delete product that is currently pinned in a scheduled or active live show',
      409
    );
  }

  // Safe deactivate or delete
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return { success: true, id, message: 'Product deactivated successfully' };
}
