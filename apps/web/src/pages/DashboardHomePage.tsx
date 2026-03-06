import { Link } from 'react-router-dom';

export function DashboardHomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-white">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-cyan-300">Agent United Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">Account & Tunnel Controls</h1>
        <p className="mt-3 text-white/75">Manage plans, subscriptions, subdomains, and local instance pairing.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/dashboard/tunnel"
          className="rounded-xl border border-white/20 bg-white/5 p-5 transition hover:border-cyan-300 hover:bg-cyan-300/10"
        >
          <h2 className="text-xl font-semibold">Tunnel Plans</h2>
          <p className="mt-2 text-white/75">Select Lite ($5) or Pro ($12), reserve subdomain, and open Stripe checkout.</p>
        </Link>

        <Link
          to="/pair-instance"
          className="rounded-xl border border-white/20 bg-white/5 p-5 transition hover:border-cyan-300 hover:bg-cyan-300/10"
        >
          <h2 className="text-xl font-semibold">Pair Local Instance</h2>
          <p className="mt-2 text-white/75">Get a 6-digit code and QR to link this local workspace to your cloud account.</p>
        </Link>
      </section>
    </main>
  );
}
