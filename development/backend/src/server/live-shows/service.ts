import { prisma } from '../db';
import { ShowStatus, VideoFormat } from '@prisma/client';
import { LiveShowsQueryInput, LiveShowDto } from './types';
import { formatMoney } from '../pricing';

export async function listLiveShows(query: LiveShowsQueryInput = {}): Promise<LiveShowDto[]> {
  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.format) {
    where.format = query.format;
  }

  if (query.brand) {
    where.brand = {
      OR: [
        { slug: query.brand },
        { id: query.brand },
      ],
    };
  }

  const shows = await prisma.liveShow.findMany({
    where,
    include: {
      brand: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              terrificProductId: true,
              owtletPrice: true,
              imageUrls: true,
              category: { select: { name: true } },
              strain: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: [
      { scheduledAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Sort with LIVE first, then SCHEDULED (scheduledAt ASC), then REPLAY (endedAt DESC)
  const sortedShows = [...shows].sort((a, b) => {
    const statusPriority: Record<ShowStatus, number> = {
      LIVE: 0,
      SCHEDULED: 1,
      REPLAY: 2,
      ARCHIVED: 3,
    };

    const prioDiff = (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
    if (prioDiff !== 0) return prioDiff;

    if (a.status === 'SCHEDULED' && b.status === 'SCHEDULED') {
      const aTime = a.scheduledAt ? a.scheduledAt.getTime() : 0;
      const bTime = b.scheduledAt ? b.scheduledAt.getTime() : 0;
      return aTime - bTime;
    }

    const aTime = (a.endedAt || a.scheduledAt || a.createdAt).getTime();
    const bTime = (b.endedAt || b.scheduledAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  return sortedShows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    format: s.format,
    status: s.status,
    scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : null,
    scheduledEndAt: s.scheduledEndAt ? s.scheduledEndAt.toISOString() : null,
    startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    thumbnailUrl: s.thumbnailUrl,
    embeddingId: s.embeddingId,
    terrificShowId: s.terrificShowId,
    brand: s.brand
      ? {
          id: s.brand.id,
          slug: s.brand.slug,
          name: s.brand.name,
        }
      : null,
    products: s.products.map((sp) => ({
      productId: sp.product.id,
      slug: sp.product.slug,
      name: sp.product.name,
      terrificProductId: sp.product.terrificProductId,
      owtletPrice: sp.product.owtletPrice ? formatMoney(sp.product.owtletPrice) : '0.00',
      imageUrls: sp.product.imageUrls,
      categoryName: sp.product.category?.name ?? null,
      strainName: sp.product.strain?.name ?? null,
      sortOrder: sp.sortOrder,
    })),
  }));
}

export async function getLiveShowById(idOrSlug: string): Promise<LiveShowDto | null> {
  const show = await prisma.liveShow.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { terrificShowId: idOrSlug },
      ],
    },
    include: {
      brand: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              terrificProductId: true,
              owtletPrice: true,
              imageUrls: true,
              category: { select: { name: true } },
              strain: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!show) return null;

  return {
    id: show.id,
    title: show.title,
    description: show.description,
    format: show.format,
    status: show.status,
    scheduledAt: show.scheduledAt ? show.scheduledAt.toISOString() : null,
    scheduledEndAt: show.scheduledEndAt ? show.scheduledEndAt.toISOString() : null,
    startedAt: show.startedAt ? show.startedAt.toISOString() : null,
    endedAt: show.endedAt ? show.endedAt.toISOString() : null,
    thumbnailUrl: show.thumbnailUrl,
    embeddingId: show.embeddingId,
    terrificShowId: show.terrificShowId,
    brand: show.brand
      ? {
          id: show.brand.id,
          slug: show.brand.slug,
          name: show.brand.name,
        }
      : null,
    products: show.products.map((sp) => ({
      productId: sp.product.id,
      slug: sp.product.slug,
      name: sp.product.name,
      terrificProductId: sp.product.terrificProductId,
      owtletPrice: sp.product.owtletPrice ? formatMoney(sp.product.owtletPrice) : '0.00',
      imageUrls: sp.product.imageUrls,
      categoryName: sp.product.category?.name ?? null,
      strainName: sp.product.strain?.name ?? null,
      sortOrder: sp.sortOrder,
    })),
  };
}
