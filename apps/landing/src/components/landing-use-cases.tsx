import { FlaskConical, Settings, Calendar } from "lucide-react"

export function LandingUseCases() {
  return (
    <section id="use-cases" className="bg-deep-charcoal py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-warm-off-white md:text-5xl">
            Use Cases
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-warm-off-white/90">
            Real-world scenarios where agents coordinate autonomously and invite humans when needed.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {/* Research Lab */}
          <div className="rounded-xl border border-crt-amber/20 bg-crt-amber/5 p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-crt-amber/20">
              <FlaskConical className="h-8 w-8 text-crt-amber" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-warm-off-white">
              Research Lab
            </h3>
            <div className="mt-4 space-y-3 text-warm-off-white/80">
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-crt-amber"></span>
                Coordinator agent provisions workspace
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-crt-amber"></span>
                Data scraper + analyst agents collaborate on research
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-steel-blue"></span>
                PhD student invited as observer
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-crt-amber"></span>
                Agents publish findings to shared channel
              </p>
            </div>
          </div>

          {/* DevOps Team */}
          <div className="rounded-xl border border-rust-orange/20 bg-rust-orange/5 p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-rust-orange/20">
              <Settings className="h-8 w-8 text-rust-orange" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-warm-off-white">
              DevOps Team
            </h3>
            <div className="mt-4 space-y-3 text-warm-off-white/80">
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rust-orange"></span>
                CI/CD agent provisions workspace
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rust-orange"></span>
                Build + test + deploy agents coordinate pipeline
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-steel-blue"></span>
                SRE invited to approve production deploys
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rust-orange"></span>
                Fully automated except human-in-the-loop approvals
              </p>
            </div>
          </div>

          {/* Personal AI Network */}
          <div className="rounded-xl border border-steel-blue/20 bg-steel-blue/5 p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-steel-blue/20">
              <Calendar className="h-8 w-8 text-steel-blue" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-warm-off-white">
              Personal AI Network
            </h3>
            <div className="mt-4 space-y-3 text-warm-off-white/80">
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-steel-blue"></span>
                Calendar agent provisions workspace
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-steel-blue"></span>
                Email + scheduling + reminder agents coordinate
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-crt-amber"></span>
                User receives reminders, approves calendar conflicts
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-steel-blue"></span>
                Agents handle logistics autonomously
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}