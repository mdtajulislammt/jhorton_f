'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/toast.store';
import { Lock, Mail, Loader2, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
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
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/shop" className="flex justify-center mb-4">
          <span className="font-heading text-3xl tracking-tight text-foreground">
            Owtlet<span className="text-primary text-2xl">™</span>
          </span>
        </Link>
        <h2 className="text-center font-heading text-2xl font-bold tracking-tight text-foreground">
          {token ? 'Reset your password' : 'Forgot your password?'}
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {token
            ? 'Enter a new secure password of at least 10 characters'
            : 'Enter your account email to receive a single-use 1-hour reset link'}
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

            {token ? (
              // Case 1: Token Present - Confirm Password Reset
              isConfirmed ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Password Updated
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your password has been reset. Redirecting you to sign in...
                  </p>
                  <Link href="/account/login">
                    <Button className="mt-4 min-h-[44px] px-6 font-bold text-xs">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                    >
                      New Password (10+ characters) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••"
                        minLength={10}
                        required
                        className="pl-9 h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                    >
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••"
                        minLength={10}
                        required
                        className="pl-9 h-11"
                      />
                    </div>
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
                  <Mail className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Check your inbox
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {requestMessage}
                  </p>
                  <div className="pt-4">
                    <Link href="/account/login">
                      <Button variant="outline" className="min-h-[40px] text-xs font-semibold">
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
                    >
                      Account Email Address
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

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[44px] font-bold text-sm active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )
            )}

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <Link href="/account/login" className="text-xs text-primary font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

