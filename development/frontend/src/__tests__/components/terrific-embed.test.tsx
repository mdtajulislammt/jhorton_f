import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { QueryProvider } from '@/components/providers/query-provider';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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
          ageVerified
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
        <TerrificEmbed ageVerified embeddingId="" />
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
          ageVerified
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
        <TerrificEmbed ageVerified embeddingId="Cki70GhqvLgWGhJbSxg2" />
      </QueryProvider>
    );

    expect(html).toContain('data-testid="terrific-loading-skeleton"');
    expect(html).toContain('Connecting to Owtlet Live Stream...');
  });

  it('shows the 21+ fallback and never renders the player when not age verified', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed ageVerified={false} embeddingId="Cki70GhqvLgWGhJbSxg2" />
      </QueryProvider>
    );

    expect(html).toContain('data-testid="terrific-age-gate-fallback"');
    expect(html).toContain('Age Verification Required');
    expect(html).not.toContain('data-source="terrific"');
    expect(html).not.toContain('terrific-sdk');
  });

  it('does not read the HttpOnly owt_age cookie on the client', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('src/components/modules/live/TerrificEmbed.tsx', 'utf8');
    expect(src).not.toContain('js-cookie');
    expect(src).not.toContain('document.cookie');
  });

  it('bare mode renders only the SDK anchor for verified visitors (floating embedding)', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed bare ageVerified embeddingId="Cki70GhqvLgWGhJbSxg2" />
      </QueryProvider>
    );
    expect(html).toContain('data-source="terrific"');
    expect(html).toContain('embedding-id="Cki70GhqvLgWGhJbSxg2"');
    expect(html).not.toContain('terrific-embed-container');
    expect(html).not.toContain('terrific-loading-skeleton');
  });

  it('bare mode renders nothing before age verification', () => {
    const html = renderToString(
      <QueryProvider>
        <TerrificEmbed bare ageVerified={false} embeddingId="Cki70GhqvLgWGhJbSxg2" />
      </QueryProvider>
    );
    expect(html).not.toContain('data-source="terrific"');
    expect(html).not.toContain('Age Verification Required');
  });
});

