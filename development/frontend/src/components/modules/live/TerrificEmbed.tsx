'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTerrificBridge } from '@/hooks/useTerrificBridge';
import { TerrificSource } from '@/lib/terrific';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, AlertCircle, RefreshCw, ShoppingBag, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export interface TerrificEmbedProps {
  /**
   * Server-verified 21+ attestation (see `isAgeVerified()` in `@/server/age-session/verified`).
   * Required: `owt_age` is HttpOnly, so the client cannot check it itself. The SDK is never
   * injected unless this is true.
   */
  ageVerified: boolean;
  /**
   * Render only the SDK anchor (no frame, badge or skeleton). For embeddings configured as a floating
   * widget in the Terrific dashboard, the SDK draws its own mini-player and ignores the in-page box.
   */
  bare?: boolean;
  embeddingId?: string;
  storeId?: string;
  sdkUrl?: string;
  liveShowId?: string;
  source?: TerrificSource;
  channelBrandSlug?: string;
  className?: string;
  aspectRatio?: 'video' | 'vertical' | 'square';
  showBadge?: boolean;
  title?: string;
}

const DEFAULT_STORE_ID = process.env.NEXT_PUBLIC_TERRIFIC_STORE_ID || 'BX2hWAVam9JjsFhXP5ZF';
const DEFAULT_EMBEDDING_ID = process.env.NEXT_PUBLIC_TERRIFIC_EMBEDDING_ID || 'Cki70GhqvLgWGhJbSxg2';
const DEFAULT_SDK_URL = process.env.NEXT_PUBLIC_TERRIFIC_SDK_URL || 'https://terrific.live/terrific-sdk.js';

export function TerrificEmbed({
  ageVerified,
  bare = false,
  embeddingId = DEFAULT_EMBEDDING_ID,
  storeId = DEFAULT_STORE_ID,
  sdkUrl = DEFAULT_SDK_URL,
  liveShowId,
  source = 'terrific_live',
  channelBrandSlug,
  className = '',
  aspectRatio = 'video',
  showBadge = true,
  title,
}: TerrificEmbedProps) {
  const router = useRouter();
  const hasAgeVerification = ageVerified === true;
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const [scriptError, setScriptError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  // Initialize Terrific Bridge hooks
  const { bridge } = useTerrificBridge({
    liveShowId,
    source,
    channelBrandSlug,
    autoInitialize: true,
  });

  // Inject Terrific SDK Script (ONLY AFTER Age Verification confirmed)
  React.useEffect(() => {
    if (!hasAgeVerification || !embeddingId) return;

    // 1. Order matters: ensure window.terrificLiveSettings is set BEFORE script injection
    bridge.initializeSettings(router);

    // 2. Check if script is already present in document
    const scriptSrc = `${sdkUrl}?storeId=${storeId}`;
    let existingScript = document.querySelector(`script[src*="terrific-sdk.js"]`) as HTMLScriptElement;

    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    // The SDK reads `document.currentScript.getAttribute('storeId')`, not the ?storeId= query.
    // Without this attribute it runs with storeId null and the embed config request fails (400).
    script.setAttribute('storeId', storeId);
    script.async = true;
    script.id = 'terrific-live-sdk';

    script.onload = () => {
      setScriptLoaded(true);
      setScriptError(false);
    };

    script.onerror = () => {
      setScriptError(true);
      setScriptLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      // Keep script in document to prevent player flicker on re-renders, but allow cleanup if needed
    };
  }, [hasAgeVerification, embeddingId, storeId, sdkUrl, bridge, router, retryCount]);

  const handleRetry = () => {
    const existing = document.querySelector(`script[src*="terrific-sdk.js"]`);
    if (existing) {
      existing.remove();
    }
    setScriptError(false);
    setScriptLoaded(false);
    setRetryCount((prev) => prev + 1);
  };

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'vertical'
      ? 'aspect-[9/16]'
      : 'aspect-square';

  // 0. Bare anchor: nothing visible of our own (never rendered before age verification)
  if (bare) {
    return hasAgeVerification && embeddingId ? (
      <div
        data-source="terrific"
        embedding-id={embeddingId}
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        data-testid="terrific-player-root"
      />
    ) : null;
  }

  // 1. Age Gate Required UI State
  if (!hasAgeVerification) {
    return (
      <div
        className={`w-full ${aspectClass} rounded-2xl border border-destructive/20 bg-card p-6 flex flex-col items-center justify-center text-center shadow-sm ${className}`}
        data-testid="terrific-age-gate-fallback"
      >
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg text-foreground mb-2">Age Verification Required</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          In accordance with New York adult-use cannabis regulations, you must verify you are 21 or older before viewing live shopping streams.
        </p>
        <Link href="/age-gate">
          <Button className="bg-primary text-primary-foreground hover:bg-owtlet-volt font-semibold">
            Verify Age (21+)
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Missing Embedding ID UI State (Empty State)
  if (!embeddingId) {
    return (
      <div
        className={`w-full ${aspectClass} rounded-2xl border border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center shadow-sm ${className}`}
        data-testid="terrific-empty-state"
      >
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <Radio className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg text-foreground mb-2">No Active Stream</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          There is no live show or shoppable video currently linked to this view. Check back soon for curated drops.
        </p>
        <Link href="/shop">
          <Button variant="outline" className="border-border">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Explore Cannabis Catalog
          </Button>
        </Link>
      </div>
    );
  }

  // 3. Error Loading Script UI State
  if (scriptError) {
    return (
      <div
        className={`w-full ${aspectClass} rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center justify-center text-center shadow-sm ${className}`}
        data-testid="terrific-error-state"
      >
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg text-foreground mb-2">Live Stream Unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          We encountered an issue connecting to the live shopping server. Please check your connection and retry.
        </p>
        <Button
          onClick={handleRetry}
          variant="outline"
          className="border-destructive/30 text-foreground hover:bg-destructive/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  // 4. Default / Success UI State (with Loading Skeleton overlay until script loads)
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border/60 bg-black shadow-md ${aspectClass} ${className}`}
      data-testid="terrific-embed-container"
    >
      {/* Live Badge Overlay */}
      {showBadge && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
          <Badge
            variant="destructive"
            className="bg-accent text-accent-foreground font-bold text-xs uppercase px-2.5 py-1 flex items-center gap-1.5 shadow-md animate-pulse"
          >
            <Radio className="h-3.5 w-3.5" />
            LIVE
          </Badge>
          {title && (
            <span className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 hidden sm:inline-block">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Loading Skeleton while SDK script initializes */}
      {!scriptLoaded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card p-6"
          data-testid="terrific-loading-skeleton"
        >
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-6 w-6 text-accent animate-pulse" />
            <Skeleton className="h-6 w-32" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Connecting to Owtlet Live Stream...
          </p>
        </div>
      )}

      {/* Terrific Live Player Anchor Element */}
      <div
        data-source="terrific"
        embedding-id={embeddingId}
        className="w-full h-full"
        data-testid="terrific-player-root"
      />
    </div>
  );
}

