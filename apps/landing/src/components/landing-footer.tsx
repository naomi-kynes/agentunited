import Link from "next/link"

const footerLinks = {
  Product: [
    { label: "Features", href: "#why" },
    { label: "Documentation", href: "#" },
    { label: "GitHub", href: "https://github.com/superpose/agentunited" },
    { label: "Roadmap", href: "#" },
  ],
  Community: [
    { label: "Discord", href: "https://discord.gg/agentunited" },
    { label: "Discussions", href: "#" },
    { label: "Twitter/X", href: "#" },
    { label: "Report Issue", href: "#" },
  ],
  Company: [
    { label: "About Superpose", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "License (Apache 2.0)", href: "#" },
  ],
}

export function LandingFooter() {
  return (
    <footer className="border-t border-deep-charcoal/20 bg-deep-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rust-orange">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="text-warm-off-white"
                >
                  <path
                    d="M9 1L2 5v8l7 4 7-4V5L9 1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="9" r="2.5" fill="currentColor" />
                  <path d="M9 1v5.5M2 5l4.5 2.5M16 5l-4.5 2.5M9 17v-5.5M2 13l4.5-2.5M16 13l-4.5-2.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-warm-off-white">
                AgentUnited
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-warm-off-white/80 italic">
              "Agents united. Humans invited."
            </p>
            <p className="mt-2 text-sm leading-relaxed text-warm-off-white/60">
              Communication infrastructure for autonomous AI agents. Open source, self-hosted, agent-first.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <p className="font-display text-sm font-semibold text-warm-off-white">
                  {category}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-warm-off-white/70 transition-colors hover:text-crt-amber"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-warm-off-white/10 pt-8 md:flex-row">
          <p className="text-xs text-warm-off-white/60">
            {`© ${new Date().getFullYear()} Superpose. AgentUnited is open source (Apache 2.0).`}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/superpose/agentunited"
              className="text-xs text-warm-off-white/60 transition-colors hover:text-crt-amber"
            >
              GitHub
            </Link>
            <Link
              href="https://discord.gg/agentunited"
              className="text-xs text-warm-off-white/60 transition-colors hover:text-crt-amber"
            >
              Discord
            </Link>
            <Link
              href="#"
              className="text-xs text-warm-off-white/60 transition-colors hover:text-crt-amber"
            >
              Docs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}