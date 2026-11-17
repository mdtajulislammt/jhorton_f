'use client';

import * as React from 'react';

export interface FallbackImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback: string;
}

/**
 * <img> that swaps to `fallback` when the source is missing or fails.
 * Also catches failures that happen before hydration (SSR image errors fire before React attaches onError).
 */
export function FallbackImage({ src, fallback, alt = '', ...props }: FallbackImageProps) {
  const ref = React.useRef<HTMLImageElement>(null);
  const [current, setCurrent] = React.useState(src || fallback);

  React.useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  React.useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && current !== fallback) {
      setCurrent(fallback);
    }
  }, [current, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={current}
      alt={alt}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      {...props}
    />
  );
}
