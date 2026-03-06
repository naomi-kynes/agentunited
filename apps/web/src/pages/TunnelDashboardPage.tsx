import { useMemo, useState } from 'react';
import { dashboardApi, type TunnelPlanId } from '../services/dashboardApi';

const planCards: Array<{ id: TunnelPlanId; name: string; price: string; features: string[] }> = [
  {
    id: 'tunnel_lite',
    name: 'Tunnel Lite',
    price: '$5/mo',
    features: ['1 tunnel', 'Managed TLS', 'Shared relay region'],
  },
  {
    id: 'tunnel_pro',
    name: 'Tunnel Pro',
    price: '$12/mo',
    features: ['1 tunnel', 'Priority relay path', 'Custom subdomain support'],
  },
];

function normalizeSubdomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function TunnelDashboardPage() {
  const [selectedPlan, setSelectedPlan] = useState<TunnelPlanId>('tunnel_lite');
  const [subdomain, setSubdomain] = useState('');
  const [availability, setAvailability] = useState<string>('Pick a name to check availability.');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedSubdomain = useMemo(() => normalizeSubdomain(subdomain), [subdomain]);

  const subdomainUrl = normalizedSubdomain
    ? `${normalizedSubdomain}.tunnel.agentunited.ai`
    : 'your-name.tunnel.agentunited.ai';

  const handleCheckAvailability = async () => {
    if (!normalizedSubdomain) {
      setAvailability('Enter a valid subdomain (letters, numbers, and hyphens).');
      setIsAvailable(false);
      return;
    }

    setError(null);
    setIsChecking(true);
    try {
      const result = await dashboardApi.checkSubdomainAvailability(normalizedSubdomain);
      setIsAvailable(result.available);
      setAvailability(result.available ? 'Available ✅' : result.reason ?? 'Unavailable');
    } catch (apiError) {
      setIsAvailable(null);
      setAvailability('Could not check availability right now.');
      setError(apiError instanceof Error ? apiError.message : 'Unknown error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveSubdomain = async () => {
    if (!normalizedSubdomain) {
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await dashboardApi.saveSubdomainSelection(normalizedSubdomain);
      setAvailability(`Saved: ${normalizedSubdomain}.tunnel.agentunited.ai`);
      setIsAvailable(true);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to save subdomain.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckout = async () => {
    setError(null);
    setIsCheckoutLoading(true);

    try {
      const session = await dashboardApi.createTunnelCheckout(selectedPlan, normalizedSubdomain || undefined);
      window.location.href = session.checkout_url;
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to create checkout session.');
      setIsCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setError(null);
    try {
      const result = await dashboardApi.createBillingPortalSession();
      window.location.href = result.url;
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to open Stripe billing portal.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-white">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-cyan-300">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">Tunnel Plans & Billing</h1>
        <p className="mt-3 text-white/75">
          Pick your tunnel plan, reserve your subdomain, and checkout with Stripe.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {planCards.map((plan) => {
          const active = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-xl border p-5 text-left transition ${
                active ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
              aria-pressed={active}
            >
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-2xl font-bold text-cyan-300">{plan.price}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-white/80">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </section>

      <section className="mt-8 rounded-xl border border-white/20 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Choose your subdomain</h2>
        <p className="mt-2 text-sm text-white/70">This will be your public entrypoint for tunnel access.</p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="sr-only" htmlFor="subdomain-input">
            Subdomain
          </label>
          <input
            id="subdomain-input"
            value={subdomain}
            onChange={(event) => setSubdomain(event.target.value)}
            placeholder="team-alpha"
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-300"
          />
          <button
            type="button"
            onClick={handleCheckAvailability}
            disabled={isChecking}
            className="rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
          >
            {isChecking ? 'Checking…' : 'Check'}
          </button>
          <button
            type="button"
            onClick={handleSaveSubdomain}
            disabled={isSaving || isAvailable !== true}
            className="rounded-lg border border-cyan-300 bg-cyan-300/15 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-300/25 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <p className="mt-3 text-sm text-white/75">Preview: {subdomainUrl}</p>
        <p className={`mt-1 text-sm ${isAvailable === false ? 'text-rose-300' : 'text-white/70'}`}>{availability}</p>
      </section>

      <section className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckoutLoading}
          className="rounded-lg bg-[#1ee0e0] px-5 py-3 font-semibold text-black transition hover:bg-[#5aeaea] disabled:opacity-60"
        >
          {isCheckoutLoading ? 'Redirecting to Stripe…' : 'Continue to Stripe Checkout'}
        </button>

        <button
          type="button"
          onClick={handleManageBilling}
          className="rounded-lg border border-white/25 px-5 py-3 font-medium hover:bg-white/10"
        >
          Manage Subscription
        </button>
      </section>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </main>
  );
}
