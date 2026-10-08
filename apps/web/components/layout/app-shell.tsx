'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CheckSquare, FolderOpen, LayoutDashboard, LogOut, Plus, X } from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { ProjectDialog } from '../projects/project-dialog';
import { TaskDialog } from '../tasks/task-dialog';

export function OrbitMark({ size = 22 }: { size?: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full border border-[#7180ff]/60" style={{ width: size, height: size }} aria-hidden="true">
      <span className="h-[34%] w-[34%] rounded-full bg-[#5B6CFF]" />
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickProjectOpen, setQuickProjectOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  const displayName = user?.fullName || user?.name || 'User';
  const initials = useMemo(() => displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), [displayName]);
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: pathname === '/dashboard' },
    { href: '/projects', label: 'Projects', icon: FolderOpen, active: pathname.startsWith('/projects') },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare, active: pathname.startsWith('/tasks') },
  ];
  const sectionTitle = pathname === '/dashboard' ? 'Dashboard' : pathname.startsWith('/projects') ? 'Projects' : 'Tasks';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } finally { setIsLoggingOut(false); }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0A0A0B]">
        <div className="flex items-center gap-3 text-sm text-[#8b8b94]">
          <span className="loading-spinner h-4 w-4 text-[#5B6CFF]" />
          Loading Orbit
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-dvh bg-[#0A0A0B] text-[#F5F5F4]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[192px] flex-col border-r border-white/[0.065] bg-[#0c0c0e] md:flex">
        <div className="flex h-[58px] items-center border-b border-white/[0.065] px-5">
          <Link href="/dashboard" className="focus-ring flex items-center gap-2.5 rounded-md" aria-label="Orbit dashboard">
            <OrbitMark size={22} />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Orbit</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-2.5 py-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined} className={`relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-[color,background-color] duration-[var(--motion-fast)] ${item.active ? 'bg-white/[0.055] text-white' : 'text-[#7f7f89] hover:bg-white/[0.03] hover:text-[#d4d4d8]'}`}>
                <span className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#5B6CFF] transition-[opacity,transform] duration-[var(--motion-ui)] ${item.active ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`} />
                <Icon className={item.active ? 'text-[#7483ff]' : 'text-[#606069]'} size={17} strokeWidth={1.7} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.065] p-2.5">
          <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5B6CFF]/12 text-[10px] font-semibold text-[#9aa5ff]">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#d4d4d8]">{displayName}</p>
              <p className="truncate text-[10px] text-[#64646d]">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="interactive-press flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-[#71717A] transition-colors hover:bg-rose-500/[0.07] hover:text-rose-300 disabled:opacity-50">
            <LogOut size={15} strokeWidth={1.7} />
            {isLoggingOut ? 'Signing out' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:pl-[192px]">
        <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-white/[0.065] bg-[#0A0A0B]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <Link href="/dashboard" className="focus-ring flex items-center gap-2.5 rounded-md md:hidden" aria-label="Orbit dashboard">
            <OrbitMark size={22} />
            <span className="text-sm font-semibold tracking-[-0.02em]">Orbit</span>
          </Link>
          <h1 className="hidden text-sm font-semibold tracking-[-0.01em] md:block">{sectionTitle}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCreateMenuOpen(true)} className="interactive-press focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B6CFF] text-white sm:hidden" aria-label="Create">
              <Plus size={16} />
            </button>
            <button onClick={() => setAccountOpen(true)} className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.055] text-[10px] font-semibold text-[#d4d4d8] md:hidden" aria-label="Open account menu">{initials}</button>
          </div>
        </header>

        <main className="page-enter mx-auto w-full max-w-[1280px] px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.075] bg-[#0c0c0e]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Mobile navigation">
        <div className="grid h-[60px] grid-cols-4 items-center px-2">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined} className={`flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium ${item.active ? 'text-[#7483ff]' : 'text-[#71717A]'}`}><Icon size={19} strokeWidth={item.active ? 2 : 1.7} /><span>{item.label}</span></Link>;
          })}
          <button onClick={() => setCreateMenuOpen(true)} className="flex h-full flex-col items-center justify-center gap-1 text-[10px] text-[#71717A]" aria-label="Create task or project">
            <span className="interactive-press flex h-8 w-8 items-center justify-center rounded-full bg-[#5B6CFF] text-white"><Plus size={17} /></span>
            <span>Create</span>
          </button>
          <Link href="/tasks" aria-current={pathname.startsWith('/tasks') ? 'page' : undefined} className={`flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium ${pathname.startsWith('/tasks') ? 'text-[#7483ff]' : 'text-[#71717A]'}`}><CheckSquare size={19} strokeWidth={pathname.startsWith('/tasks') ? 2 : 1.7} /><span>Tasks</span></Link>
        </div>
      </nav>

      {createMenuOpen ? (
        <Sheet title="Create" onClose={() => setCreateMenuOpen(false)}>
          <button onClick={() => { setCreateMenuOpen(false); setQuickTaskOpen(true); }} className="w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"><span className="block text-sm font-medium text-white">New task</span><span className="mt-0.5 block text-xs text-[#71717A]">Add work to a project</span></button>
          <button onClick={() => { setCreateMenuOpen(false); setQuickProjectOpen(true); }} className="mt-1 w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"><span className="block text-sm font-medium text-white">New project</span><span className="mt-0.5 block text-xs text-[#71717A]">Create a focused workspace</span></button>
        </Sheet>
      ) : null}

      {accountOpen ? (
        <Sheet title="Account" onClose={() => setAccountOpen(false)}>
          <div className="px-3 py-2"><p className="text-sm font-medium text-white">{displayName}</p><p className="mt-0.5 text-xs text-[#71717A]">{user?.email}</p></div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm text-rose-300 transition-colors hover:bg-rose-500/[0.07]"><LogOut size={16} />{isLoggingOut ? 'Signing out' : 'Sign out'}</button>
        </Sheet>
      ) : null}

      <TaskDialog open={quickTaskOpen} onOpenChange={setQuickTaskOpen} />
      <ProjectDialog open={quickProjectOpen} onOpenChange={setQuickProjectOpen} />
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end p-3 md:hidden">
      <button className="fade-in absolute inset-0 bg-black/65" onClick={onClose} aria-label="Close sheet" />
      <div className="sheet-slide-up relative z-10 w-full rounded-xl border border-white/[0.09] bg-[#171719] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-2 flex items-center justify-between border-b border-white/[0.07] px-1 pb-2.5"><p className="text-sm font-semibold">{title}</p><button onClick={onClose} className="rounded-md p-1 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label="Close"><X size={16} /></button></div>
        {children}
      </div>
    </div>
  );
}
