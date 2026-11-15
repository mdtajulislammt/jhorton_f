'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, RotateCcw, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterBarProps {
  categories?: Array<{ slug: string; name: string }>;
  brands?: Array<{ slug: string; name: string }>;
  totalCount?: number;
}

const DEFAULT_CATEGORIES = [
  { slug: '', name: 'All Products' },
  { slug: 'flower', name: 'Flower' },
  { slug: 'pre-rolls', name: 'Pre-Rolls' },
  { slug: 'vapes', name: 'Vapes' },
  { slug: 'edibles', name: 'Edibles' },
  { slug: 'concentrates', name: 'Concentrates' },
];

const STRAIN_TYPES = [
  { value: '', label: 'All Strains' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'SATIVA', label: 'Sativa' },
  { value: 'INDICA', label: 'Indica' },
  { value: 'CBD', label: 'High CBD' },
];

export function FilterBar({
  categories = DEFAULT_CATEGORIES,
  brands = [],
  totalCount,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentStrain = searchParams.get('strainType') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentQ = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = React.useState(currentQ);

  // Sync state if URL changes externally
  React.useEffect(() => {
    setSearchTerm(currentQ);
  }, [currentQ]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset pagination cursor when filters change
    params.delete('cursor');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchTerm.trim() });
  };

  const handleReset = () => {
    setSearchTerm('');
    router.push(pathname);
  };

  const hasActiveFilters = !!(currentCategory || currentStrain || currentBrand || currentQ);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      {/* Search Input Row */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by strain, effect, or craft product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-sm bg-background border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="default"
            className="h-11 px-5 font-bold min-h-[44px]"
          >
            Search
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-11 px-3 min-h-[44px] text-muted-foreground hover:text-foreground"
              title="Reset all filters"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1 flex items-center">
          <Filter className="h-3.5 w-3.5 mr-1" /> Category:
        </span>
        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug;
          return (
            <button
              key={cat.slug || 'all'}
              type="button"
              onClick={() => updateFilters({ category: cat.slug || null })}
              className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-primary text-owtlet-ink shadow-sm'
                  : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Strain Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Strain:
        </span>
        {STRAIN_TYPES.map((strain) => {
          const isActive = currentStrain === strain.value;
          return (
            <button
              key={strain.value || 'all'}
              type="button"
              onClick={() => updateFilters({ strainType: strain.value || null })}
              className={`min-h-[32px] inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
            >
              {isActive && <Check className="mr-1 h-3 w-3 text-primary" />}
              {strain.label}
            </button>
          );
        })}

        {/* Brand Selector if brands exist */}
        {brands.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="brand-select" className="text-xs text-muted-foreground">
              Brand:
            </label>
            <select
              id="brand-select"
              value={currentBrand}
              onChange={(e) => updateFilters({ brand: e.target.value || null })}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>
            {totalCount !== undefined
              ? `Showing ${totalCount} matching cannabis product${totalCount !== 1 ? 's' : ''}`
              : 'Filtered results'}
          </span>
          <button
            onClick={handleReset}
            className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

