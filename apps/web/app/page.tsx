'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0A0A0B] text-[#F5F5F4]">
      <div className="flex items-center gap-3">
        <span className="loading-spinner h-4 w-4 text-[#5B6CFF]" />
        <p className="text-sm text-[#8b8b94]">Loading Orbit</p>
      </div>
    </div>
  );
}
