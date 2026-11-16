import { ShowStatus, VideoFormat } from '@prisma/client';
import { z } from 'zod';

export const liveShowsQuerySchema = z.object({
  status: z.nativeEnum(ShowStatus).optional(),
  format: z.nativeEnum(VideoFormat).optional(),
  brand: z.string().trim().optional(),
});

export type LiveShowsQueryInput = z.infer<typeof liveShowsQuerySchema>;

export interface PinnedProductDto {
  productId: string;
  slug: string;
  name: string;
  terrificProductId: string | null;
  owtletPrice: string;
  imageUrls: string[];
  categoryName?: string | null;
  strainName?: string | null;
  sortOrder: number;
}

export interface LiveShowDto {
  id: string;
  title: string;
  description: string | null;
  format: VideoFormat;
  status: ShowStatus;
  scheduledAt: string | null;
  scheduledEndAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  thumbnailUrl: string | null;
  embeddingId: string;
  terrificShowId: string | null;
  brand: {
    id: string;
    slug: string;
    name: string;
  } | null;
  products: PinnedProductDto[];
}

