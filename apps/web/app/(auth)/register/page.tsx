'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthShell } from '../../../components/layout/auth-shell';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiError } from '../../../lib/api/client';
import { useAuth } from '../../../providers/auth-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Full name is required';
    else if (name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters';
    if (!email.trim()) nextErrors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 8) nextErrors.password = 'Use at least 8 characters';
    else if (new TextEncoder().encode(password).length > 72) nextErrors.password = 'Password exceeds the 72 byte limit';
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({ fullName: name.trim(), email: email.trim().toLowerCase(), password });
      setPassword('');
      setConfirmPassword('');
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) setMessage(error.statusCode === 409 ? 'An account with this email already exists.' : error.message);
      else setMessage('Unable to connect to Orbit. Check your connection and try again.');
    } finally { setIsLoading(false); }
  };

  return (
    <AuthShell mode="register">
      <div className="page-enter">
        <h2 className="text-[30px] font-semibold tracking-[-0.04em]">Create your account</h2>
        <p className="mt-2 text-sm text-[#8b8b94]">Set up Orbit and start organizing your work.</p>
        {message ? <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div> : null}
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
          <Input id="name" label="Full name" autoComplete="name" placeholder="Ahmad Nur Fauzi" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
          <Input id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
          <div className="relative"><Input id="password" label="Password" hint="8-72 bytes" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} className="pr-11" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="focus-ring absolute right-2 top-[29px] rounded-md p-2 text-[#71717A] hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <Input id="confirm-password" label="Confirm password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={errors.confirmPassword} />
          <Button className="w-full" type="submit" size="lg" isLoading={isLoading}>Create account</Button>
        </form>
        <p className="mt-6 border-t border-white/[0.075] pt-5 text-center text-sm text-[#71717A]">Already use Orbit? <Link href="/login" className="focus-ring rounded-sm font-medium text-[#8B98FF] hover:text-white">Sign in</Link></p>
      </div>
    </AuthShell>
  );
}
