'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell, authAlert, authInput, authLabel } from '@/components/layout/auth-shell';

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both administrative email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || 'Invalid administrative credentials');
        setIsLoading(false);
        return;
      }

      router.push(redirectTarget);
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      variant="admin"
      eyebrow="STAFF ONLY"
      title="Sign in to the Console"
      description="Enter your authorized staff credentials to manage the platform."
      footer={<p className="text-xs text-muted">Protected by Argon2id HMAC session authentication.</p>}
    >
      {errorMessage && (
        <div role="alert" className={authAlert}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className={authLabel}>
            Staff Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@owtlet.com"
              autoComplete="email"
              required
              className={authInput}
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" className={authLabel}>
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
              Authenticating...
            </>
          ) : (
            <>
              Sign In to Console
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

/** useSearchParams() needs a Suspense boundary for the static build (Next.js 14 CSR bailout). */
export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <AdminLoginPageContent />
    </React.Suspense>
  );
}
