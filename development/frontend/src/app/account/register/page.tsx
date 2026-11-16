'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/toast.store';
import { Lock, Mail, User, Phone, MapPin, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/account';

  const [email, setEmail] = React.useState(searchParams.get('email') || '');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState(searchParams.get('firstName') || '');
  const [lastName, setLastName] = React.useState(searchParams.get('lastName') || '');
  const [phone, setPhone] = React.useState(searchParams.get('phone') || '');
  const [homeZip, setHomeZip] = React.useState(searchParams.get('zip') || '');

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      setErrorMessage('Password must be at least 10 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          phone: phone.trim() || null,
          homeZip: homeZip.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Registration failed');
      }

      toast.success('Shopper profile created successfully!');
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/shop" className="flex justify-center mb-4">
          <span className="font-heading text-3xl tracking-tight text-foreground">
            Owtlet<span className="text-primary text-2xl">™</span>
          </span>
        </Link>
        <h2 className="text-center font-heading text-2xl font-bold tracking-tight text-foreground">
          Create Shopper Profile
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Save your delivery preferences and default partner store for faster checkout
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="pt-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                >
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shopper@example.com"
                    required
                    className="pl-9 h-11"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                >
                  Password (10+ characters) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    minLength={10}
                    required
                    className="pl-9 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="212-555-0199"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="homeZip"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                  >
                    Home ZIP
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="homeZip"
                      value={homeZip}
                      onChange={(e) => setHomeZip(e.target.value)}
                      placeholder="10001"
                      maxLength={5}
                      className="pl-9 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Regulatory Notice */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Owtlet never collects government ID images or payment information for cannabis. Any active cart items will automatically link to your new account.
                </span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[44px] font-bold text-sm active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href={`/account/login?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

