'use client';

import * as React from 'react';
import Link from 'next/link';
import { User, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCheckoutStore } from '@/stores/checkout.store';
import { useAuthStore } from '@/stores/auth.store';
import { useShopperProfile } from '@/hooks/useShopperAccount';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const { contact, setContact, saveToProfile, setSaveToProfile } = useCheckoutStore();
  const { isAuthenticated, user } = useAuthStore();
  const { data: shopperProfile } = useShopperProfile();

  // If user or shopper is authenticated, pre-fill contact info
  React.useEffect(() => {
    if (shopperProfile) {
      setContact({
        firstName: contact.firstName || shopperProfile.firstName || '',
        lastName: contact.lastName || shopperProfile.lastName || '',
        email: contact.email || shopperProfile.email || '',
        phone: contact.phone || shopperProfile.phone || '',
      });
    } else if (isAuthenticated && user) {
      const nameParts = (user.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setContact({
        firstName: contact.firstName || firstName,
        lastName: contact.lastName || lastName,
        email: contact.email || user.email || '',
        phone: contact.phone || user.phone || '',
      });
    }
  }, [shopperProfile, isAuthenticated, user, setContact]);

  const isSignedIn = Boolean(shopperProfile || isAuthenticated);

  return (
    <div
      className={`p-5 rounded-2xl border border-border bg-card text-foreground shadow-sm space-y-4 ${className || ''}`}
      data-testid="contact-form"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Customer Contact Info
          </h3>
        </div>

        {!isSignedIn && (
          <Link
            href="/account/login?redirect=/checkout"
            className="text-xs text-foreground underline-offset-4 hover:underline font-medium transition-colors"
          >
            Sign in for faster checkout
          </Link>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="contact-first-name" className="block text-xs font-medium text-foreground mb-1">
              First Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="contact-first-name"
              name="firstName"
              type="text"
              required
              placeholder="e.g. Jordan"
              value={contact.firstName}
              onChange={(e) => setContact({ firstName: e.target.value })}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div>
            <label htmlFor="contact-last-name" className="block text-xs font-medium text-foreground mb-1">
              Last Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="contact-last-name"
              name="lastName"
              type="text"
              required
              placeholder="e.g. Taylor"
              value={contact.lastName}
              onChange={(e) => setContact({ lastName: e.target.value })}
              className="h-11 rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-xs font-medium text-foreground mb-1">
            Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="jordan@example.com"
            value={contact.email}
            onChange={(e) => setContact({ email: e.target.value })}
            className="h-11 rounded-xl text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Order confirmation and dispensary routing receipt sent here.
          </p>
        </div>

        <div>
          <label htmlFor="contact-phone" className="block text-xs font-medium text-foreground mb-1">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            required
            placeholder="e.g. (212) 555-0199"
            value={contact.phone}
            onChange={(e) => setContact({ phone: e.target.value })}
            className="h-11 rounded-xl text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Required by dispensary couriers for delivery updates & pickup arrival.
          </p>
        </div>

        {/* Save to Profile Checkbox */}
        <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none text-xs text-foreground">
          <input
            type="checkbox"
            checked={saveToProfile}
            onChange={(e) => setSaveToProfile(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
          />
          <span>Save contact details for faster future checkout</span>
        </label>
      </div>

      {/* Compliance / Zero-ID notice (AC-SEC-01) */}
      <div className="p-3 rounded-xl bg-background/60 border border-border flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Zero-ID & Zero-Payment Policy: </span>
          Owtlet never collects government ID, date of birth, or cannabis payment details. Licensed
          dispensaries verify physical 21+ photo ID in-person at handoff.
        </div>
      </div>
    </div>
  );
}

