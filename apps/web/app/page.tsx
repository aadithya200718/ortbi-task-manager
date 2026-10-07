export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full text-center space-y-4 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-600 text-white font-bold text-xl">
          O
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Orbit
        </h1>
        <p className="text-lg font-medium text-slate-600">
          Project &amp; Task Manager
        </p>
        <div className="pt-4 border-t border-slate-100 text-sm text-slate-500">
          Phase 1 — Repository Foundation
        </div>
      </div>
    </main>
  );
}
