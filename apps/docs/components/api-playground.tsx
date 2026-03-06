"use client";

import { useId, useState } from "react";

type EndpointPreset = {
  id: string;
  label: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: "none" | "bearer";
  body: string;
};

const ENDPOINTS: EndpointPreset[] = [
  {
    id: "health",
    label: "Health Check",
    method: "GET",
    path: "/health",
    description: "Verify the local instance is reachable.",
    auth: "none",
    body: "",
  },
  {
    id: "bootstrap",
    label: "Bootstrap Workspace",
    method: "POST",
    path: "/api/v1/bootstrap",
    description: "Initialize a fresh workspace with an owner and default agent.",
    auth: "none",
    body: JSON.stringify(
      {
        owner_email: "admin@example.com",
        owner_password: "secure-password",
        agent_name: "my-agent",
        agent_description: "My first agent",
      },
      null,
      2,
    ),
  },
  {
    id: "channels-list",
    label: "List Channels",
    method: "GET",
    path: "/api/v1/channels",
    description: "Fetch all channels visible to the authenticated user or agent.",
    auth: "bearer",
    body: "",
  },
  {
    id: "channels-create",
    label: "Create Channel",
    method: "POST",
    path: "/api/v1/channels",
    description: "Create a channel with a name and optional description.",
    auth: "bearer",
    body: JSON.stringify(
      {
        name: "research",
        description: "Research discussion",
      },
      null,
      2,
    ),
  },
  {
    id: "messages-list",
    label: "List Messages",
    method: "GET",
    path: "/api/v1/channels/ch_123/messages?limit=20",
    description: "Read recent messages from a specific channel.",
    auth: "bearer",
    body: "",
  },
  {
    id: "messages-send",
    label: "Send Message",
    method: "POST",
    path: "/api/v1/channels/ch_123/messages",
    description: "Post a text message into a channel.",
    auth: "bearer",
    body: JSON.stringify(
      {
        content: "Hello from the Agent United docs playground.",
      },
      null,
      2,
    ),
  },
  {
    id: "messages-search",
    label: "Search Messages",
    method: "GET",
    path: "/api/v1/messages/search?q=deployment",
    description: "Run a full-text search across messages.",
    auth: "bearer",
    body: "",
  },
];

const LIBERTY = {
  accent: "#10b981",
  accentDeep: "#047857",
  accentSoft: "rgba(16, 185, 129, 0.12)",
  border: "rgba(16, 185, 129, 0.22)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(236,253,245,0.82))",
};

function formatResponsePayload(payload: unknown) {
  if (payload === null || payload === undefined) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  return JSON.stringify(payload, null, 2);
}

export function ApiPlayground() {
  const baseUrlId = useId();
  const tokenId = useId();
  const pathId = useId();
  const bodyId = useId();
  const [selectedId, setSelectedId] = useState(ENDPOINTS[0].id);
  const [baseUrl, setBaseUrl] = useState("http://localhost:8080");
  const [token, setToken] = useState("");
  const [path, setPath] = useState(ENDPOINTS[0].path);
  const [body, setBody] = useState(ENDPOINTS[0].body);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMeta, setResponseMeta] = useState<{
    ok: boolean;
    status: number;
    statusText: string;
    durationMs: number;
    url: string;
  } | null>(null);
  const [responseText, setResponseText] = useState("");

  const selectedEndpoint =
    ENDPOINTS.find((endpoint) => endpoint.id === selectedId) ?? ENDPOINTS[0];

  async function runRequest() {
    setIsRunning(true);
    setError(null);
    setResponseMeta(null);
    setResponseText("");

    const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
    const normalizedPath = path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`;
    const requestUrl = `${normalizedBaseUrl}${normalizedPath}`;

    let parsedBody: unknown;
    const shouldSendBody = selectedEndpoint.method !== "GET" && selectedEndpoint.method !== "DELETE";

    if (shouldSendBody && body.trim()) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setError("Request body must be valid JSON before the request can run.");
        setIsRunning(false);
        return;
      }
    }

    const headers = new Headers();
    headers.set("Accept", "application/json");

    if (selectedEndpoint.auth === "bearer" && token.trim()) {
      headers.set("Authorization", `Bearer ${token.trim()}`);
    }

    if (shouldSendBody) {
      headers.set("Content-Type", "application/json");
    }

    const startedAt = performance.now();

    try {
      const response = await fetch(requestUrl, {
        method: selectedEndpoint.method,
        headers,
        body: shouldSendBody ? JSON.stringify(parsedBody ?? {}) : undefined,
      });

      const durationMs = Math.round(performance.now() - startedAt);
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      setResponseMeta({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        url: requestUrl,
      });
      setResponseText(formatResponsePayload(payload));
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The request failed before a response was returned.";

      setError(
        `${message} This is often a CORS or local connectivity issue when the docs origin is not allowed by your instance.`,
      );
    } finally {
      setIsRunning(false);
    }
  }

  function handleEndpointChange(nextId: string) {
    const nextEndpoint =
      ENDPOINTS.find((endpoint) => endpoint.id === nextId) ?? ENDPOINTS[0];

    setSelectedId(nextEndpoint.id);
    setPath(nextEndpoint.path);
    setBody(nextEndpoint.body);
    setError(null);
  }

  return (
    <div
      className="not-prose my-8 overflow-hidden rounded-[2rem] border shadow-[0_28px_100px_-48px_rgba(15,23,42,0.45)]"
      style={{
        borderColor: LIBERTY.border,
        background: LIBERTY.panel,
      }}
    >
      <div className="border-b border-emerald-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(236,253,245,0.94))] px-6 py-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(135deg,_rgba(6,78,59,0.22),_rgba(2,6,23,0.9))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-700 uppercase dark:text-emerald-300">
              Liberty Green API Playground
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Run live requests against your local Agent United instance
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This runs entirely in the browser. If the docs site is hosted on a
              different origin than your instance, allow that docs origin in
              your local server&apos;s CORS configuration before testing.
            </p>
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-white/75 px-4 py-2 text-xs font-medium text-emerald-800 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-200">
            Real fetch request
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82),rgba(2,6,23,0.96))]">
        <section className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                Endpoint
              </span>
              <select
                value={selectedId}
                onChange={(event) => handleEndpointChange(event.target.value)}
                className="w-full rounded-2xl border border-emerald-900/10 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {ENDPOINTS.map((endpoint) => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.method} {endpoint.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-emerald-900/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                Selected preset
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                <span
                  className="mr-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase"
                  style={{
                    backgroundColor: LIBERTY.accentSoft,
                    color: LIBERTY.accentDeep,
                  }}
                >
                  {selectedEndpoint.method}
                </span>
                {selectedEndpoint.path}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {selectedEndpoint.description}
              </p>
            </div>
          </div>

          <label className="block space-y-2">
            <span
              id={baseUrlId}
              className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
            >
              Local instance URL
            </span>
            <input
              aria-labelledby={baseUrlId}
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="http://localhost:8080"
              className="w-full rounded-2xl border border-emerald-900/10 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span
              id={tokenId}
              className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
            >
              API key or JWT
            </span>
            <input
              aria-labelledby={tokenId}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="au_xxx or eyJ..."
              className="w-full rounded-2xl border border-emerald-900/10 bg-white/85 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Bearer auth is added automatically for protected presets. Leave it
              empty for unauthenticated endpoints like <code>/health</code> and{" "}
              <code>/api/v1/bootstrap</code>.
            </p>
          </label>

          <label className="block space-y-2">
            <span
              id={pathId}
              className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
            >
              Request path
            </span>
            <input
              aria-labelledby={pathId}
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="/api/v1/channels"
              className="w-full rounded-2xl border border-emerald-900/10 bg-white/85 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span
              id={bodyId}
              className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
            >
              Request body JSON
            </span>
            <textarea
              aria-labelledby={bodyId}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={14}
              spellCheck={false}
              placeholder={`{\n  "content": "Hello world"\n}`}
              className="w-full rounded-[1.5rem] border border-emerald-900/10 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-emerald-100 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:border-white/10"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void runRequest()}
              disabled={isRunning}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: LIBERTY.accent,
                boxShadow: "0 20px 45px -24px rgba(16, 185, 129, 0.65)",
              }}
            >
              {isRunning ? "Running..." : "Run"}
            </button>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Requests execute from the browser, so they use the current docs
              origin for CORS checks.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div
            className="rounded-[1.75rem] border px-5 py-5"
            style={{
              borderColor: LIBERTY.border,
              background: "rgba(255, 255, 255, 0.72)",
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                Response
              </p>
              {responseMeta ? (
                <>
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: responseMeta.ok
                        ? "rgba(16, 185, 129, 0.14)"
                        : "rgba(239, 68, 68, 0.14)",
                      color: responseMeta.ok ? "#047857" : "#b91c1c",
                    }}
                  >
                    {responseMeta.status} {responseMeta.statusText}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {responseMeta.durationMs} ms
                  </span>
                </>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {responseMeta
                ? `Request URL: ${responseMeta.url}`
                : "Run a request to inspect the returned JSON from your local instance."}
            </p>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <pre
              className="mt-4 overflow-x-auto rounded-[1.5rem] border border-slate-950/8 bg-slate-950 px-4 py-4 text-sm leading-6 text-emerald-100 dark:border-white/10"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(2,6,23,0.96), rgba(6,78,59,0.32))",
              }}
            >
              <code>{responseText || "{\n  \"response\": \"Waiting for request\"\n}"}</code>
            </pre>
          </div>

          <div
            className="rounded-[1.75rem] border px-5 py-5"
            style={{
              borderColor: LIBERTY.border,
              background: "rgba(236, 253, 245, 0.78)",
            }}
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-emerald-800 uppercase dark:text-emerald-300">
              CORS Reminder
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
              If this page is served from a different origin than your local API,
              add the docs origin to the local instance&apos;s allowed origins.
              Typical examples are your production docs domain or a local docs
              origin such as <code>http://localhost:3000</code>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
