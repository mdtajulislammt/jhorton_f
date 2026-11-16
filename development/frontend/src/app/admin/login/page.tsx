'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
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
    <div className="min-h-screen bg-[#071311] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#70F1C7]/10 border border-[#70F1C7]/30 mb-4 text-[#70F1C7]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-['Dela_Gothic_One']">
            OWTLET<span className="text-[#70F1C7]">.ADMIN</span>
          </h1>
          <p className="text-[#BBD7D1] text-sm mt-1">
            Cannabis Marketplace & Live Shopping Operations
          </p>
        </div>

        <Card className="bg-[#0D221E] border-[#1A3832] text-white shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-[#BBD7D1] text-sm">
              Enter your authorized staff credentials to manage the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBD7D1]/60" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ops@owtlet.com"
                    autoComplete="email"
                    required
                    className="pl-9 bg-[#071311] border-[#1A3832] text-white placeholder:text-gray-500 focus:border-[#70F1C7] focus:ring-[#70F1C7]/20 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBD7D1]/60" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="pl-9 bg-[#071311] border-[#1A3832] text-white placeholder:text-gray-500 focus:border-[#70F1C7] focus:ring-[#70F1C7]/20 h-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold h-11 text-base transition-all active:scale-[0.98] mt-2 shadow-lg shadow-[#70F1C7]/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Console
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#1A3832] text-center text-xs text-[#BBD7D1]/60">
              Protected by Argon2id HMAC session authentication.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

