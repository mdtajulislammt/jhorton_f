'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, authAlert, authInput, authLabel, authLink } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/toast.store';
import { Lock, Mail, User, Phone, MapPin, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

function RegisterPageContent() {
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
    <AuthShell
      eyebrow="OPTIONAL PROFILE"
      title="Create Shopper Profile"
      description="Save your delivery preferences and default partner store for faster checkout."
      footer={
        <p>
          Already have an account?{' '}
          <Link href={`/account/login?redirect=${encodeURIComponent(redirectUrl)}`} className={authLink}>
            Sign in
          </Link>
        </p>
      }
    >
            {errorMessage && (
              <div role="alert" className={authAlert}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className={authLabel}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shopper@example.com"
                    required
                    className={authInput}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={authLabel}>
                  Password (10+ characters) *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    minLength={10}
                    required
                    className={authInput}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className={authLabel}>
                    First Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className={authInput}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className={authLabel}>
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className={`${authInput} pl-3.5`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="phone" className={authLabel}>
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="212-555-0199"
                      className={authInput}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="homeZip" className={authLabel}>
                    Home ZIP
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="homeZip"
                      value={homeZip}
                      onChange={(e) => setHomeZip(e.target.value)}
                      placeholder="10001"
                      maxLength={5}
                      className={authInput}
                    />
                  </div>
                </div>
              </div>

              {/* Regulatory Notice */}
              <div className="flex items-start gap-2.5 rounded-xl bg-surface-muted p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>
                  Owtlet never collects government ID images or payment information for cannabis. Any active cart items will automatically link to your new account.
                </span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group h-12 w-full text-[14.5px] font-bold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Profile
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
    </AuthShell>
  );
}

/** useSearchParams() needs a Suspense boundary for the static build (Next.js 14 CSR bailout). */
export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <RegisterPageContent />
    </React.Suspense>
  );
}
