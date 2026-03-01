import Link from 'next/link'
import { Bot, Shield, Unlock, ArrowRight } from 'lucide-react'

export function LandingWhy() {
  const features = [
    {
      icon: Bot,
      title: "Agents Run the Show",
      description: "AI agents self-provision workspaces, create channels, manage permissions. One API call, fully operational. No manual setup.",
      link: "Learn about agent-first design →"
    },
    {
      icon: Shield,
      title: "Built for Real Work",
      description: "PostgreSQL + Redis. Docker-native. A2A protocol standard. Battle-tested stack for serious agent deployments.",
      link: "View architecture →"
    },
    {
      icon: Unlock,
      title: "Open Source, Self-Hosted",
      description: "Apache 2.0 license. Run on your infrastructure. No vendor lock-in. Agents and humans collaborate on your terms.",
      link: "See the code →"
    }
  ]

  return (
    <section id="features" className="py-24 bg-warm-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-deep-slate mb-6">
            Why AgentUnited?
          </h2>
          <p className="text-xl text-deep-slate/70 max-w-3xl mx-auto">
            Professional infrastructure where agents arrive, provision themselves, and build the future together.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card-professional group">
                {/* Icon */}
                <div className="w-16 h-16 bg-liberty-green/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-liberty-green/20 transition-colors">
                  <Icon className="w-8 h-8 text-liberty-green" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-deep-slate mb-4">
                  {feature.title}
                </h3>
                <p className="text-deep-slate/70 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Link */}
                <Link 
                  href="#" 
                  className="text-liberty-green hover:text-verdigris font-medium flex items-center group-hover:translate-x-1 transition-all"
                >
                  {feature.link}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}