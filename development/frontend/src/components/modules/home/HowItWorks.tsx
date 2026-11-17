import * as React from 'react';
import { SectionHeader } from '@/components/ui/section-header';

// Design v3 step illustrations, drawn with theme tokens (no hex) so they follow the palette.
function PhoneArt() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <rect x="14" y="4" width="36" height="56" rx="8" className="fill-ink" />
      <rect x="18" y="10" width="28" height="44" rx="5" className="fill-owtlet-ink opacity-70" />
      <rect x="21" y="13" width="12" height="6" rx="3" className="fill-accent" />
      <path d="M29 28v12l9-6z" className="fill-primary" />
    </svg>
  );
}

function PinArt() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <path d="M32 4c-11 0-19 8-19 19 0 14 19 37 19 37s19-23 19-37C51 12 43 4 32 4z" className="fill-accent" />
      <circle cx="32" cy="23" r="8" className="fill-card" />
    </svg>
  );
}

function BagArt() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <path d="M10 20h44l-4 40H14z" strokeWidth="2" strokeLinejoin="round" className="fill-kraft stroke-ink" />
      <path d="M22 20v-6a10 10 0 0 1 20 0v6" strokeWidth="2.4" fill="none" className="stroke-ink" />
      <rect x="21" y="32" width="22" height="14" rx="3" className="fill-owtlet-mist" />
      <text x="32" y="42.5" fontSize="9" fontWeight="700" textAnchor="middle" className="fill-ink font-body">
        21+
      </text>
    </svg>
  );
}

const STEPS = [
  {
    icon: PhoneArt,
    title: 'Watch and tap',
    body: 'Join a Live Show and tap a pinned product to add it to your Cart at the Owtlet Price.',
  },
  {
    icon: PinArt,
    title: 'We pick the store',
    body: 'Your Cart goes to the nearest partner dispensary with stock. You can Change Store before checkout.',
  },
  {
    icon: BagArt,
    title: 'Pickup or Delivery',
    body: 'The licensed dispensary checks your ID and takes payment. Owtlet never takes payment for cannabis.',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-content px-4 pb-14 sm:px-7 lg:pb-[60px]">
      <SectionHeader title="How Owtlet works" />
      <ol className="grid overflow-hidden rounded-[22px] border border-border bg-card md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col gap-3 border-b border-border p-[26px] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          >
            <span className="font-mono text-xs font-bold text-success">STEP {i + 1}</span>
            <step.icon />
            <strong className="text-lg text-foreground">{step.title}</strong>
            <p className="text-[14.5px] text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
