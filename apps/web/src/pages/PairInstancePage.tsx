import { useEffect, useMemo, useState } from 'react';
import { dashboardApi, type PairingStatus } from '../services/dashboardApi';

function formatExpiry(value?: string): string {
  if (!value) {
    return 'Unknown expiry';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown expiry';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function PairInstancePage() {
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pairingCode = useMemo(() => {
    if (!pairing?.code) {
      return '------';
    }

    if (pairing.code.includes('-')) {
      return pairing.code;
    }

    if (pairing.code.length === 6) {
      return `${pairing.code.slice(0, 3)}-${pairing.code.slice(3)}`;
    }

    return pairing.code;
  }, [pairing]);

  const loadPairing = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await dashboardApi.getPairingStatus();
      setPairing(result);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to load pairing data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshCode = async () => {
    setError(null);
    try {
      const result = await dashboardApi.refreshPairingCode();
      setPairing(result);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to refresh pairing code.');
    }
  };

  useEffect(() => {
    void loadPairing();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-cyan-300">Local Instance</p>
        <h1 className="mt-2 text-3xl font-semibold">Pair Instance</h1>
        <p className="mt-3 text-white/75">
          Link this local workspace with your cloud account to receive tunnel provisioning updates automatically.
        </p>
      </header>

      <section className="rounded-2xl border border-white/20 bg-white/5 p-6">
        {loading ? (
          <p className="text-white/75">Loading pairing code…</p>
        ) : (
          <>
            <p className="text-sm text-white/70">Enter this code in agentunited.ai/dashboard during setup:</p>
            <p className="mt-3 font-mono text-4xl font-semibold tracking-[0.2em] text-[#1ee0e0]">{pairingCode}</p>
            <p className="mt-2 text-sm text-white/60">Expires around {formatExpiry(pairing?.expires_at)}</p>

            <div className="mt-6 rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="mb-3 text-sm text-white/70">QR option</p>
              {pairing?.qr_svg ? (
                <div
                  className="mx-auto h-48 w-48 [&>svg]:h-full [&>svg]:w-full"
                  aria-label="Pairing QR Code"
                  // Backend-provided trusted SVG for pairing flow
                  dangerouslySetInnerHTML={{ __html: pairing.qr_svg }}
                />
              ) : (
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-white/30 text-center text-xs text-white/50">
                  QR will appear when the local pairing endpoint is enabled.
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void refreshCode()}
                className="rounded-lg bg-[#1ee0e0] px-4 py-2 font-semibold text-black hover:bg-[#5aeaea]"
              >
                Refresh code
              </button>
              <button
                type="button"
                onClick={() => void loadPairing()}
                className="rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10"
              >
                Reload status
              </button>
            </div>
          </>
        )}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </section>
    </main>
  );
}
