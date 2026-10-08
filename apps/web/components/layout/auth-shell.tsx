import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { OrbitMark } from './app-shell';

export function AuthShell({ mode, children }: { mode: 'login' | 'register'; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-[#0A0A0B] lg:grid-cols-[52%_48%]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.075] px-[clamp(3rem,6vw,6rem)] py-12 lg:flex lg:flex-col">
        <Link href="/" className="focus-ring flex w-fit items-center gap-3 rounded-md" aria-label="Orbit home"><OrbitMark size={27} /><span className="text-lg font-semibold tracking-[-0.025em]">Orbit</span></Link>
        <div className="my-auto max-w-xl pb-4 pt-12">
          <h1 className="max-w-[8ch] text-[clamp(3.25rem,5vw,5rem)] font-semibold leading-[0.96] tracking-[-0.065em]">Keep work moving.</h1>
          <p className="mt-6 text-lg leading-8 text-[#8b8b94]">Plan projects.<br />Finish tasks.<br />Stay focused.</p>
          <AuthGeometry mode={mode} />
        </div>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="focus-ring mb-12 flex w-fit items-center gap-2.5 rounded-md lg:hidden" aria-label="Orbit home"><OrbitMark size={24} /><span className="text-base font-semibold tracking-[-0.02em]">Orbit</span></Link>
          {children}
        </div>
      </section>
    </main>
  );
}

function AuthGeometry({ mode }: { mode: 'login' | 'register' }) {
  const rows = mode === 'login'
    ? [{ title: 'Plan the next milestone', done: true, meta: '3 of 4 tasks' }, { title: 'Review active work', done: false, meta: 'In progress' }, { title: 'Close the loop', done: false, meta: 'Pending' }]
    : [{ title: 'Create a focused project', done: true, meta: 'Ready' }, { title: 'Add the next task', done: true, meta: 'Ready' }, { title: 'Move work forward', done: false, meta: 'Next' }];
  return (
    <div className="relative mt-14 max-w-[620px] border-t border-white/[0.07] pl-8">
      <div className="absolute bottom-0 left-2 top-0 w-px bg-white/[0.09]" />
      {rows.map((row, index) => (
        <div key={row.title} className="relative flex min-h-[70px] items-center gap-4 border-b border-white/[0.07]">
          <span className={`absolute -left-[30px] flex h-4 w-4 items-center justify-center rounded-full border ${row.done ? 'border-[#7080ff] bg-[#5B6CFF] text-white' : 'border-white/30 bg-[#0A0A0B] text-transparent'}`}>{row.done ? <Check size={10} strokeWidth={3} /> : null}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#D4D4D8]">{row.title}</p><div className="mt-2 h-0.5 max-w-[260px] bg-white/[0.07]"><div className="h-full bg-[#5B6CFF]" style={{ width: `${index === 0 ? 78 : index === 1 ? 46 : 18}%` }} /></div></div>
          <span className="text-xs text-[#71717A]">{row.meta}</span><ArrowRight size={14} className="text-[#64646d]" />
        </div>
      ))}
    </div>
  );
}
