import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

describe('Owtlet UI Primitives & Brand Token Integration', () => {
  describe('Button Component', () => {
    it('renders with default pill styling, Mint bg, Ink text, and Volt hover', () => {
      const html = renderToString(<Button>Reserve Drop</Button>);
      expect(html).toContain('rounded-full');
      expect(html).toContain('bg-primary');
      expect(html).toContain('text-primary-foreground');
      expect(html).toContain('hover:bg-primary-hover');
      expect(html).toContain('focus-visible:ring-2');
      expect(html).toContain('focus-visible:ring-ring');
      expect(html).toContain('active:scale-[0.98]');
      expect(html).toContain('Reserve Drop');
    });

    it('renders secondary variant with Sage bg and Ink text', () => {
      const html = renderToString(<Button variant="secondary">View Replay</Button>);
      expect(html).toContain('bg-secondary');
      expect(html).toContain('text-secondary-foreground');
    });

    it('renders accent variant with Owtlet Ember bg', () => {
      const html = renderToString(<Button variant="accent">Live Checkout</Button>);
      expect(html).toContain('bg-accent');
      expect(html).toContain('text-accent-foreground');
    });

    it('renders loading spinner and disabled state when isLoading is true', () => {
      const html = renderToString(<Button isLoading>Processing</Button>);
      expect(html).toContain('disabled');
      expect(html).toContain('animate-spin');
    });

    it('supports large size with 44px min touch height for mobile ergonomics', () => {
      const html = renderToString(<Button size="lg">Tap to Confirm</Button>);
      expect(html).toContain('min-h-[44px]');
      expect(html).toContain('h-11');
    });
  });

  describe('Badge Component', () => {
    it('renders default badge with Mint bg and Ink text (WCAG 2.2 AA compliant ~12:1)', () => {
      const html = renderToString(<Badge>Hybrid 24%</Badge>);
      expect(html).toContain('bg-primary');
      expect(html).toContain('text-primary-foreground');
      expect(html).not.toContain('text-white');
    });

    it('renders LIVE badge with Ember accent, white text, and pulsing indicator dot', () => {
      const html = renderToString(<Badge variant="live">LIVE</Badge>);
      expect(html).toContain('bg-accent');
      expect(html).toContain('text-white');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('data-testid="live-indicator-dot"');
      expect(html).toContain('LIVE');
    });

    it('includes accessible focus ring styles', () => {
      const html = renderToString(<Badge tabIndex={0}>Focusable Badge</Badge>);
      expect(html).toContain('focus-visible:ring-2');
      expect(html).toContain('focus-visible:ring-ring');
    });
  });

  describe('Card Component', () => {
    it('renders card surface with border, card background, and typography', () => {
      const html = renderToString(
        <Card>
          <CardHeader>
            <CardTitle>Sour Diesel 3.5g</CardTitle>
            <CardDescription>Sativa · THC 26.5%</CardDescription>
          </CardHeader>
          <CardContent>$50.00</CardContent>
          <CardFooter>In Stock</CardFooter>
        </Card>
      );
      expect(html).toContain('rounded-xl');
      expect(html).toContain('border-border');
      expect(html).toContain('bg-card');
      expect(html).toContain('font-heading');
      expect(html).toContain('Sour Diesel 3.5g');
      expect(html).toContain('Sativa · THC 26.5%');
    });

    it('supports interactive card with elevation on hover', () => {
      const html = renderToString(<Card interactive>Interactive Card</Card>);
      expect(html).toContain('cursor-pointer');
      expect(html).toContain('hover:-translate-y-0.5');
      expect(html).toContain('hover:shadow-md');
    });
  });

  describe('Input Component', () => {
    it('renders with 44px ergonomics and focus ring styles', () => {
      const html = renderToString(
        <Input name="zipCode" placeholder="10001" helperText="Delivery ZIP code" />
      );
      expect(html).toContain('h-10');
      expect(html).toContain('sm:h-11');
      expect(html).toContain('focus-visible:ring-2');
      expect(html).toContain('Delivery ZIP code');
      expect(html).not.toContain('aria-invalid="true"');
    });

    it('renders validation error state with danger borders and message', () => {
      const html = renderToString(
        <Input
          name="zipCode"
          error
          helperText="We don't deliver to this ZIP code yet."
        />
      );
      expect(html).toContain('border-danger');
      expect(html).toContain('focus-visible:ring-danger');
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('text-danger');
      expect(html).toContain('We don&#x27;t deliver to this ZIP code yet.');
    });
  });

  describe('Dialog Component', () => {
    it('returns null when closed', () => {
      const html = renderToString(
        <Dialog isOpen={false} onClose={() => {}}>
          <p>Hidden Content</p>
        </Dialog>
      );
      expect(html).toBe('');
    });

    it('renders modal backdrop and dialog surface with focus ring on close button', () => {
      const html = renderToString(
        <Dialog
          isOpen={true}
          onClose={() => {}}
          title="Change Dispensary"
          description="Select an alternate licensed dispensary."
        >
          <div>Dispensary List</div>
        </Dialog>
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('backdrop-blur-sm');
      expect(html).toContain('Change Dispensary');
      expect(html).toContain('Select an alternate licensed dispensary.');
      expect(html).toContain('focus-visible:ring-2');
      expect(html).toContain('focus-visible:ring-ring');
    });
  });

  describe('Skeleton Component', () => {
    it('renders with status role and animate-pulse shimmer', () => {
      const html = renderToString(<Skeleton className="h-6 w-32" />);
      expect(html).toContain('role="status"');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('h-6 w-32');
    });
  });

  describe('EmptyState Component', () => {
    it('renders Lucide icon, headline, description, and primary CTA button', () => {
      const html = renderToString(
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Catch a Live Show or browse the Shop."
          action={{
            label: 'Explore Live Shows',
            href: '/',
          }}
        />
      );
      expect(html).toContain('Your cart is empty');
      expect(html).toContain('Catch a Live Show or browse the Shop.');
      expect(html).toContain('Explore Live Shows');
      expect(html).toContain('rounded-full');
      expect(html).toContain('bg-primary');
    });
  });
});
