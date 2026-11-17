'use client';

import * as React from 'react';

/** Brand logo that falls back to initials when the image is missing or fails to load. */
export function LogoImage({ src, label }: { src?: string | null; label: string }) {
  const ref = React.useRef<HTMLImageElement>(null);
  const [failed, setFailed] = React.useState(!src);

  React.useEffect(() => setFailed(!src), [src]);

  // Catch failures that happened before hydration attached onError.
  React.useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed || !src) return <>{label}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={src} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" />
  );
}
