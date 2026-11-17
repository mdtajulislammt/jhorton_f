'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, authAlert, authInput, authLabel, authLink } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/toast.store';
import { AlertCircle, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/account';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Login failed');
      }

      toast.success('Welcome back!');
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="SHOPPER ACCOUNT"
      title="Sign in to your account"
      description="Access your saved addresses, default partner store, and orders."
      footer={
        <>
          <p>
            Don&apos;t have an account yet?{' '}
            <Link href={`/account/register?redirect=${encodeURIComponent(redirectUrl)}`} className={authLink}>
              Create optional profile
            </Link>
          </p>
          <p className="text-xs text-muted">Guest checkout is always supported without an account.</p>
        </>
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
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shopper@example.com"
              autoComplete="email"
              required
              className={authInput}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-bold text-foreground">
              Password
            </label>
            <Link href="/account/reset" className={`${authLink} text-xs`}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              required
              className={authInput}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="group mt-2 h-12 w-full text-[14.5px] font-bold">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

/** useSearchParams() needs a Suspense boundary for the static build (Next.js 14 CSR bailout). */
export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  );
}
