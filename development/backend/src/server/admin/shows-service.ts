import { prisma } from '../db';
import { ShowStatus, VideoFormat } from '@prisma/client';
import { recomputeHeldCarts } from '../cart/expiry';

export class AdminShowError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminShowError';
  }
}

export interface CreateShowInput {
  title: string;
  slug?: string;
  description?: string | null;
  format?: 'LIVE_SHOW' | 'SHOPPABLE_VIDEO';
  brandId?: string | null;
  terrificShowId?: string | null;
  embeddingId?: string;
  scheduledAt?: string | Date | null;
  scheduledEndAt?: string | Date | null;
  thumbnailUrl?: string | null;
}

export interface UpdateShowInput extends Partial<CreateShowInput> {
  status?: ShowStatus;
}

export async function listAdminShows() {
  const shows = await prisma.liveShow.findMany({
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              owtletPrice: true,
              imageUrls: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { heldCarts: true },
      },
    },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  });

  return shows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    format: s.format,
    status: s.status,
    brandId: s.brandId,
    brand: s.brand,
    terrificShowId: s.terrificShowId,
    embeddingId: s.embeddingId,
    scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : null,
    scheduledEndAt: s.scheduledEndAt ? s.scheduledEndAt.toISOString() : null,
    startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    thumbnailUrl: s.thumbnailUrl,
    heldCartsCount: s._count.heldCarts,
    pinnedProductsCount: s.products.length,
    products: s.products.map((p) => ({
      showId: p.showId,
      productId: p.productId,
      sortOrder: p.sortOrder,
      product: {
        id: p.product.id,
        name: p.product.name,
        slug: p.product.slug,
        owtletPrice: p.product.owtletPrice ? Number(p.product.owtletPrice) : null,
        categoryName: p.product.category?.name,
        imageUrls: p.product.imageUrls,
      },
    })),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function createAdminShow(data: CreateShowInput) {
  if (!data.title) {
    throw new AdminShowError('VALIDATION_ERROR', 'Title is required', 400);
  }

  const show = await prisma.liveShow.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      format: (data.format as VideoFormat) || 'LIVE_SHOW',
      brandId: data.brandId ?? null,
      terrificShowId: data.terrificShowId ?? null,
      embeddingId: data.embeddingId || 'Cki70GhqvLgWGhJbSxg2',
      status: 'SCHEDULED',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : null,
      thumbnailUrl: data.thumbnailUrl ?? null,
    },
    include: {
      brand: true,
      products: true,
    },
  });

  return show;
}

export async function updateAdminShow(id: string, data: UpdateShowInput) {
  const existing = await prisma.liveShow.findUnique({ where: { id } });
  if (!existing) {
    throw new AdminShowError('NOT_FOUND', 'Live show not found', 404);
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.format !== undefined) updateData.format = data.format;
  if (data.brandId !== undefined) updateData.brandId = data.brandId;
  if (data.terrificShowId !== undefined) updateData.terrificShowId = data.terrificShowId;
  if (data.embeddingId !== undefined) updateData.embeddingId = data.embeddingId;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.scheduledAt !== undefined) {
    updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  }
  if (data.scheduledEndAt !== undefined) {
    updateData.scheduledEndAt = data.scheduledEndAt ? new Date(data.scheduledEndAt) : null;
  }
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;

  const updated = await prisma.liveShow.update({
    where: { id },
    data: updateData,
    include: {
      brand: true,
      products: true,
    },
  });

  return updated;
}

export async function pinProductToShow(
  showId: string,
  productId: string,
  sortOrder: number = 0
) {
  const show = await prisma.liveShow.findUnique({ where: { id: showId } });
  if (!show) {
    throw new AdminShowError('NOT_FOUND', 'Live show not found', 404);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AdminShowError('NOT_FOUND', 'Product not found', 404);
  }

  // Acceptance Criteria AC-ADM-01 & Invariant: Pinned show products MUST have owtletPrice set
  if (product.owtletPrice === null || product.owtletPrice === undefined) {
    throw new AdminShowError(
      'PRICE_REQUIRED',
      `Cannot pin product "${product.name}": show products must have an Owtlet price set (AC-ADM-01)`,
      422
    );
  }

  const pinned = await prisma.showProduct.upsert({
    where: {
      showId_productId: {
        showId,
        productId,
      },
    },
    create: {
      showId,
      productId,
      sortOrder,
    },
    update: {
      sortOrder,
    },
    include: {
      product: {
        select: { id: true, name: true, slug: true, owtletPrice: true },
      },
    },
  });

  return pinned;
}

export async function unpinProductFromShow(showId: string, productId: string) {
  await prisma.showProduct.deleteMany({
    where: {
      showId,
      productId,
    },
  });

  return { success: true, showId, productId };
}

export async function startShow(id: string) {
  const show = await prisma.liveShow.findUnique({ where: { id } });
  if (!show) {
    throw new AdminShowError('NOT_FOUND', 'Live show not found', 404);
  }

  const started = await prisma.liveShow.update({
    where: { id },
    data: {
      status: 'LIVE',
      startedAt: new Date(),
    },
  });

  return started;
}

export async function endShow(id: string) {
  const show = await prisma.liveShow.findUnique({ where: { id } });
  if (!show) {
    throw new AdminShowError('NOT_FOUND', 'Live show not found', 404);
  }

  const endedAt = new Date();

  // Invariant (REQ-F-016 & ADR-012): When show ends, held carts extend to endedAt + 30m
  const ended = await prisma.liveShow.update({
    where: { id },
    data: {
      status: 'REPLAY',
      endedAt,
    },
  });

  // Recompute expiration time for all active carts linked to this show (AC-HOLD-01, T-HOLD-01)
  await recomputeHeldCarts(id);

  return ended;
}
