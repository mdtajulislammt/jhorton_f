'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, authAlert, authInput, authLabel, authLink } from '@/components/layout/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/toast.store';
import { AlertCircle, Lock, Mail, Loader2, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Request Reset State
  const [email, setEmail] = React.useState('');
  const [isRequested, setIsRequested] = React.useState(false);
  const [requestMessage, setRequestMessage] = React.useState('');

  // Confirm Reset State
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/account/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();
      setIsRequested(true);
      setRequestMessage(
        json.message ||
          'If an account exists with that email, a password reset link has been sent.'
      );
      toast.info('Password reset link sent if account exists');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit reset request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      setErrorMessage('Password must be at least 10 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/account/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Password reset failed');
      }

      setIsConfirmed(true);
      toast.success('Your password has been successfully reset!');
      setTimeout(() => {
        router.push('/account/login');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset link is invalid or expired');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title={token ? 'Reset your password' : 'Forgot your password?'}
      description={
        token
          ? 'Enter a new secure password of at least 10 characters.'
          : 'Enter your account email to receive a single-use 1-hour reset link.'
      }
      footer={
        <p>
          <Link href="/account/login" className={authLink}>
            Back to Sign In
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

            {token ? (
              // Case 1: Token Present - Confirm Password Reset
              isConfirmed ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
                  <h2 className="font-heading text-xl text-foreground">
                    Password Updated
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your password has been reset. Redirecting you to sign in...
                  </p>
                  <Button className="mt-4 h-11 px-6 font-bold" onClick={() => router.push('/account/login')}>
                    Go to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className={authLabel}>
                      New Password (10+ characters) *
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••"
                        minLength={10}
                        required
                        className={authInput}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={authLabel}>
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••"
                        minLength={10}
                        required
                        className={authInput}
                      />
                    </div>
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
                          Updating password...
                        </>
                      ) : (
                        'Save New Password'
                      )}
                    </Button>
                  </div>
                </form>
              )
            ) : (
              // Case 2: No Token - Request Reset Email
              isRequested ? (
                <div className="text-center py-6 space-y-3">
                  <Mail className="mx-auto h-12 w-12 text-success" />
                  <h2 className="font-heading text-xl text-foreground">
                    Check your inbox
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {requestMessage}
                  </p>
                  <div className="pt-4">
                    <Button variant="outline" className="h-11 px-6 font-bold" onClick={() => router.push('/account/login')}>
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label htmlFor="email" className={authLabel}>
                      Account Email Address
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

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="group h-12 w-full text-[14.5px] font-bold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )
            )}
    </AuthShell>
  );
}

/** useSearchParams() needs a Suspense boundary for the static build (Next.js 14 CSR bailout). */
export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <ResetPasswordPageContent />
    </React.Suspense>
  );
}
