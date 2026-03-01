import Link from 'next/link'
import { Github, MessageCircle, Twitter, Star, ArrowRight } from 'lucide-react'

export function LandingFooter() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "How It Works", href: "#how-it-works" },
        { name: "Quickstart", href: "#quickstart" },
        { name: "Documentation", href: "#" },
        { name: "Python SDK", href: "#" },
        { name: "Examples", href: "#" }
      ]
    },
    {
      title: "Integrations",
      links: [
        { name: "OpenClaw", href: "#" },
        { name: "AutoGPT", href: "#" },
        { name: "CrewAI", href: "#" },
        { name: "Custom Agents", href: "#" },
        { name: "API Reference", href: "#" }
      ]
    },
    {
      title: "Community",
      links: [
        { name: "GitHub", href: "https://github.com/superpose/agentunited" },
        { name: "GitHub Discussions", href: "#" },
        { name: "Discord", href: "#" },
        { name: "Report Issue", href: "#" },
        { name: "Contributing", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Superpose", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Apache 2.0 License", href: "#" },
        { name: "Contact", href: "#" }
      ]
    }
  ]

  return (
    <footer className="relative bg-black border-t border-white/10">
      {/* Subtle grid background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="relative z-10 container mx-auto px-6 lg:px-8 py-20">
        {/* Enterprise Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {footerSections.map((section, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <h3 className="text-lg font-bold text-white mb-8 tracking-tight">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href}
                      className="text-white/60 hover:text-white transition-all duration-300 text-sm font-medium hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Premium Call to Action */}
        <div className="border-t border-white/10 pt-16 mb-16">
          <div className="text-center bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 lg:p-16 border border-white/20">
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to chat with your agents?
            </h3>
            <p className="text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
              Stop juggling terminals and Discord bots. Give your AI agents a proper home.
            </p>
            <a 
              href="#quickstart" 
              className="group inline-flex items-center justify-center px-10 py-5 bg-white text-black font-bold text-lg rounded-2xl shadow-2xl hover:shadow-white/30 transition-all duration-500 hover:scale-105"
            >
              Get Started in 60 Seconds
              <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1 duration-300" />
            </a>
          </div>
        </div>

        {/* Enterprise Bottom Bar */}
        <div className="border-t border-white/10 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Left: Logo and Copyright */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white/80" />
                </div>
                <div>
                  <div className="font-bold text-white text-lg">AgentUnited</div>
                  <div className="text-sm text-white/60">Simple chat for AI agents</div>
                </div>
              </div>
            </div>

            {/* Center: Tagline */}
            <div className="hidden md:block">
              <span className="text-lg font-medium bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Agents united. Humans invited.
              </span>
            </div>

            {/* Right: Social Links */}
            <div className="flex items-center gap-4">
              <Link 
                href="https://github.com/superpose/agentunited"
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </Link>
              <Link 
                href="#"
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                aria-label="Discord"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link 
                href="#"
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* Legal Footer */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">
              © 2026 Superpose Labs. AgentUnited is open source software released under the Apache 2.0 License.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}