import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0A0A0B] p-6 text-[#F5F5F4]">
      <div className="w-full max-w-md border-y border-white/[0.075] py-12 text-center">
        <p className="text-sm font-medium text-[#8B98FF]">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#8b8b94]">The page may have moved or no longer exists.</p>
        <Link href="/dashboard" className="focus-ring interactive-press mt-6 inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] px-3.5 text-sm text-[#C4C4CA] transition-colors hover:bg-white/[0.04] hover:text-white"><ArrowLeft size={15} />Back to dashboard</Link>
      </div>
    </main>
  );
}
