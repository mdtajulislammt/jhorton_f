import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { QueryProvider } from '@/components/providers/query-provider';
import Cookies from 'js-cookie';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    cart: null,
    itemCount: 0,
    refetch: vi.fn(),
  })),
}));

describe('TerrificEmbed Component (AC-LIVE-01..03, 6 UI States)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders player container and anchor element with embedding ID (AC-LIVE-01)', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed
          embeddingId="Cki70GhqvLgWGhJbSxg2"
          storeId="BX2hWAVam9JjsFhXP5ZF"
          title="Owtlet Launch Drop"
          showBadge={true}
        />
      </QueryProvider>
    );

    // Player container
    expect(html).toContain('data-testid="terrific-embed-container"');
    // Anchor element for Terrific SDK
    expect(html).toContain('data-source="terrific"');
    expect(html).toContain('embedding-id="Cki70GhqvLgWGhJbSxg2"');
    // LIVE Badge
    expect(html).toContain('LIVE');
    expect(html).toContain('Owtlet Launch Drop');
  });

  it('renders empty state when embeddingId is empty or falsy', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed embeddingId="" />
      </QueryProvider>
    );

    expect(html).toContain('data-testid="terrific-empty-state"');
    expect(html).toContain('No Active Stream');
    expect(html).toContain('Explore Cannabis Catalog');
  });

  it('renders with vertical aspect ratio when specified', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed
          embeddingId="Cki70GhqvLgWGhJbSxg2"
          aspectRatio="vertical"
        />
      </QueryProvider>
    );

    expect(html).toContain('aspect-[9/16]');
  });

  it('renders loading skeleton by default during initial mount', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed embeddingId="Cki70GhqvLgWGhJbSxg2" />
      </QueryProvider>
    );

    expect(html).toContain('data-testid="terrific-loading-skeleton"');
    expect(html).toContain('Connecting to Owtlet Live Stream...');
  });
});
