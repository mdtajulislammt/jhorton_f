import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { BRAND_PHOTOS } from '@/lib/brand-photos';

const CATEGORIES = [
  { slug: 'flower', name: 'Flower', note: 'Indica, sativa, hybrid', photo: BRAND_PHOTOS.flowerCola },
  { slug: 'pre-rolls', name: 'Pre-Rolls', note: 'Singles and packs', photo: BRAND_PHOTOS.preRollDisplay },
  { slug: 'vapes', name: 'Vapes', note: 'Carts and all-in-ones', photo: BRAND_PHOTOS.vape },
  { slug: 'edibles', name: 'Edibles', note: 'Gummies and chews', photo: BRAND_PHOTOS.edibles },
  { slug: 'concentrates', name: 'Concentrates', note: 'Live resin, wax, crumble', photo: BRAND_PHOTOS.concentrate },
];

export function CategoryShowcase() {
  return (
    <section className="mx-auto max-w-content px-4 pb-14 sm:px-7 lg:pb-[60px]">
      <SectionHeader title="Shop by category" />
      <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[44%] grid-flow-col gap-3.5 overflow-x-auto px-4 pb-2 sm:auto-cols-[30%] lg:mx-0 lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className="group relative isolate flex aspect-[3/4] snap-start items-end overflow-hidden rounded-[20px] text-owtlet-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cat.photo}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08] motion-reduce:group-hover:scale-100"
            />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent from-40% to-owtlet-ink/90" />
            <span className="flex w-full items-center justify-between gap-2 p-4">
              <span>
                <span className="block text-base font-bold">{cat.name}</span>
                <span className="block text-xs text-owtlet-sage">{cat.note}</span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:-rotate-45 group-hover:bg-primary-hover">
                <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
