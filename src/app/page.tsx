export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Phase 1 Foundation
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          TaskFlow now has a clean Next.js foundation with Tailwind enabled from
          the start.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          This shell is intentionally minimal. It establishes the project
          structure, styling path, Supabase-ready environment surface, and route
          boundaries without introducing board, card, auth, or drag-and-drop
          product behavior yet.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
          <span className="rounded-full bg-teal-50 px-4 py-2 text-teal-700">
            App Router
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
            Tailwind
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
            Supabase-ready envs
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
            No feature logic
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Route Groups</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              <code>src/app/(auth)</code> and <code>src/app/(app)</code> are
              scaffolded so later phases can add auth and protected screens
              without reshaping the repo.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Supabase Path</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Supabase is represented only by environment setup and the
              dedicated <code>src/lib/supabase</code> folder at this stage.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Phase Boundary</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Middleware stays deferred until auth routes and protected pages
              exist. Adding it now would be structure without behavior.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
