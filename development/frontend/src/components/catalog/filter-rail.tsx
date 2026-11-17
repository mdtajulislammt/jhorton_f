'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterOption {
  slug: string;
  name: string;
}

export const STRAIN_FILTERS: { value: string; label: string }[] = [
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'SATIVA', label: 'Sativa' },
  { value: 'INDICA', label: 'Indica' },
  { value: 'CBD', label: 'High CBD' },
];

export const THC_MIN = 0;
export const THC_MAX = 100;

/** Lets the catalog view dim the grid while a filter navigation is in flight. */
export const CatalogTransitionContext = React.createContext<React.TransitionStartFunction | null>(null);

/** Shared URL filter state for the rail, toolbar chips and mobile sheet. */
export function useCatalogFilters() {
  const startTransition = React.useContext(CatalogTransitionContext);
  const router = useRouter();
  const pathname = usePathname() ?? '/shop';
  const searchParams = useSearchParams();
  const params = React.useMemo(() => new URLSearchParams(searchParams?.toString() ?? ''), [searchParams]);

  const go = React.useCallback(
    (href: string) => {
      if (startTransition) startTransition(() => router.push(href));
      else router.push(href);
    },
    [router, startTransition]
  );

  const update = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      next.delete('cursor');
      const qs = next.toString();
      go(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, go]
  );

  const num = (key: string) => {
    const v = params.get(key);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    params,
    pathname,
    strainType: params.get('strainType') ?? '',
    brand: params.get('brand') ?? '',
    q: params.get('q') ?? '',
    minThc: num('minThc'),
    maxThc: num('maxThc'),
    update,
    go,
    clear: () => go(pathname),
  };
}

function RailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={title}>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex min-h-[32px] cursor-pointer items-center gap-2 py-1 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer rounded accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      {children}
    </label>
  );
}

/** Dual-handle THC % range (design v3). Commits to the URL when the handle is released. */
function ThcRange() {
  const { minThc, maxThc, update } = useCatalogFilters();
  const [lo, setLo] = React.useState(minThc ?? THC_MIN);
  const [hi, setHi] = React.useState(maxThc ?? THC_MAX);

  React.useEffect(() => {
    setLo(minThc ?? THC_MIN);
    setHi(maxThc ?? THC_MAX);
  }, [minThc, maxThc]);

  const commit = () => {
    update({
      minThc: lo > THC_MIN ? String(lo) : null,
      maxThc: hi < THC_MAX ? String(hi) : null,
    });
  };

  const pct = (v: number) => ((v - THC_MIN) / (THC_MAX - THC_MIN)) * 100;
  const thumb = 'range-thumb';

  return (
    <RailGroup title="THC %">
      <div className="relative mx-1 mb-1 mt-3 h-1.5 rounded-full bg-border">
        <div className="absolute inset-y-0 rounded-full bg-ink" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={THC_MIN}
          max={THC_MAX}
          value={lo}
          aria-label="Minimum THC %"
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - 1))}
          onPointerUp={commit}
          onKeyUp={commit}
          className={thumb}
        />
        <input
          type="range"
          min={THC_MIN}
          max={THC_MAX}
          value={hi}
          aria-label="Maximum THC %"
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + 1))}
          onPointerUp={commit}
          onKeyUp={commit}
          className={thumb}
        />
      </div>
      <div className="flex justify-between font-mono text-[11.5px] text-muted">
        <span>{lo}%</span>
        <span>{hi}%</span>
      </div>
    </RailGroup>
  );
}

export interface FilterRailProps {
  brands: FilterOption[];
  className?: string;
}

/** Catalog filter rail (design v3 `.rail`): white card with strain, THC and brand groups. */
export function FilterRail({ brands, className }: FilterRailProps) {
  const { strainType, brand, update } = useCatalogFilters();

  return (
    <div className={cn('flex flex-col gap-[18px] rounded-[18px] border border-border bg-card p-[18px]', className)}>
      <RailGroup title="Strain type">
        {STRAIN_FILTERS.map((s) => (
          <CheckRow
            key={s.value}
            checked={strainType === s.value}
            onChange={() => update({ strainType: strainType === s.value ? null : s.value })}
          >
            {s.label}
          </CheckRow>
        ))}
      </RailGroup>

      <ThcRange />

      {brands.length > 0 ? (
        <RailGroup title="Brand">
          <div className="max-h-72 overflow-y-auto">
            {brands.map((b) => (
              <CheckRow key={b.slug} checked={brand === b.slug} onChange={() => update({ brand: brand === b.slug ? null : b.slug })}>
                <span className="truncate">{b.name}</span>
              </CheckRow>
            ))}
          </div>
        </RailGroup>
      ) : null}
    </div>
  );
}

/** Mobile trigger + bottom sheet wrapping the same rail. */
export function MobileFilterSheet({ brands, activeCount }: { brands: FilterOption[]; activeCount: number }) {
  const [open, setOpen] = React.useState(false);
  const searchParams = useSearchParams();

  // Close the sheet after any filter navigation.
  React.useEffect(() => setOpen(false), [searchParams]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-h-[40px] gap-2 rounded-[10px] bg-card lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        {activeCount > 0 ? (
          <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-owtlet-mist">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Catalog filters">
          <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="absolute inset-0 bg-owtlet-night/50" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-5 pb-8 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl text-foreground">Filters</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <FilterRail brands={brands} />
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Removable Ink chips for the active filters (design v3 `.active`). */
export function ActiveFilterChips({ brands }: { brands: FilterOption[] }) {
  const { strainType, brand, q, minThc, maxThc, update, clear } = useCatalogFilters();

  const chips: { key: string; label: string; clear: Record<string, null> }[] = [];
  if (q) chips.push({ key: 'q', label: `“${q}”`, clear: { q: null } });
  if (strainType) {
    chips.push({
      key: 'strainType',
      label: STRAIN_FILTERS.find((s) => s.value === strainType)?.label ?? strainType,
      clear: { strainType: null },
    });
  }
  if (minThc !== null || maxThc !== null) {
    chips.push({ key: 'thc', label: `THC ${minThc ?? THC_MIN}–${maxThc ?? THC_MAX}%`, clear: { minThc: null, maxThc: null } });
  }
  if (brand) chips.push({ key: 'brand', label: brands.find((b) => b.slug === brand)?.name ?? brand, clear: { brand: null } });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => update(c.clear)}
          className="inline-flex min-h-[30px] items-center gap-1.5 rounded-full bg-ink py-[5px] pl-3 pr-2.5 text-[12.5px] font-bold text-owtlet-mist transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label}
          <X className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={clear}
        className="min-h-[30px] rounded-sm px-1.5 text-xs font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </button>
    </div>
  );
}
