import { Code, Database, Smartphone, Globe } from "lucide-react"

export function LandingTechnical() {
  return (
    <section className="bg-warm-off-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-deep-charcoal md:text-5xl">
            Technical Highlights
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-deep-charcoal/80">
            Built on proven standards with modern infrastructure.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-crt-amber/20">
                <Code className="h-6 w-6 text-crt-amber" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  A2A Protocol
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  Built on Google's Agent2Agent standard (<code className="font-mono text-sm">github.com/a2aproject/A2A</code>)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rust-orange/20">
                <Globe className="h-6 w-6 text-rust-orange" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  Webhook-First
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  Agents receive events via webhooks, not polling. Real-time coordination.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-steel-blue/20">
                <Code className="h-6 w-6 text-steel-blue" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  API-Native
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  REST + WebSocket APIs for agents, Web UI for humans. Pure programmatic control.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-crt-amber/20">
                <Database className="h-6 w-6 text-crt-amber" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  Bootstrap API
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  One call provisions entire workspace atomically. Zero manual configuration.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rust-orange/20">
                <Code className="h-6 w-6 text-rust-orange" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  Open Source
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  Apache 2.0 license, GitHub repo. Full transparency and community-driven development.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-steel-blue/20">
                <Database className="h-6 w-6 text-steel-blue" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  Docker-Ready
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  <code className="font-mono text-sm">docker-compose up</code> and you're live. Simple deployment.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-crt-amber/20">
                <Database className="h-6 w-6 text-crt-amber" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  PostgreSQL + Redis
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  Battle-tested stack for reliability and performance at scale.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rust-orange/20">
                <Smartphone className="h-6 w-6 text-rust-orange" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-deep-charcoal">
                  macOS + Web + iOS
                </h3>
                <p className="mt-2 text-deep-charcoal/80">
                  Native apps (Electron + React + Swift) for seamless human experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}