export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-800">
            Agent United
          </div>
        </header>

        <section className="flex flex-1 items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Company
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Agent United
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              We build tools for working with AI agents.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
