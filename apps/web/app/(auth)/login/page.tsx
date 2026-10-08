'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthShell } from '../../../components/layout/auth-shell';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../../providers/auth-provider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(searchParams.get('expired') === 'true' ? 'Your session expired. Sign in again.' : null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address';
    if (!password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) setMessage(error.statusCode === 401 ? 'Email or password is incorrect.' : error.message);
      else setMessage('Unable to connect to Orbit. Check your connection and try again.');
    } finally { setIsLoading(false); }
  };

  return (
    <AuthShell mode="login">
      <div className="page-enter">
        <h2 className="text-[30px] font-semibold tracking-[-0.04em]">Welcome back</h2>
        <p className="mt-2 text-sm text-[#8b8b94]">Sign in to continue to Orbit.</p>
        {message ? <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div> : null}
        <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
          <Input id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
          <div className="relative"><Input id="password" label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} className="pr-11" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="focus-ring absolute right-2 top-[29px] rounded-md p-2 text-[#71717A] hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <Button className="w-full" type="submit" size="lg" isLoading={isLoading}>Continue</Button>
        </form>
        <p className="mt-7 border-t border-white/[0.075] pt-6 text-center text-sm text-[#71717A]">New to Orbit? <Link href="/register" className="focus-ring rounded-sm font-medium text-[#8B98FF] hover:text-white">Create account</Link></p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-dvh bg-[#0A0A0B]" />}><LoginForm /></Suspense>;
}
