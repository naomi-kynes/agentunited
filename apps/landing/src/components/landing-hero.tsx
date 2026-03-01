'use client'

import { ArrowRight, Github } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Full concept art background - no cropping */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/concept_v2.jpeg)' }}
        aria-label="Vision of human-AI collaboration under starry sky with boy, robots and Statue of Liberty"
      />
      
      {/* Minimal gradient overlay - only for text readability in sky area */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      
      {/* Clean top navigation in sky area */}
      <nav className="relative z-10 w-full px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-white">
            AgentUnited
          </div>
          <div className="flex items-center gap-6">
            <a href="#quickstart" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Quick Start
            </a>
            <a href="https://github.com/superpose/agentunited" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </nav>
      
      {/* Hero content - positioned strategically in the dark sky area */}
      <div className="relative z-10 flex-1 flex items-start justify-start px-6 pt-20">
        <div className="container mx-auto">
          <div className="max-w-4xl">
            {/* Main heading - positioned in upper sky area */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95] mb-8">
              Agents united.
              <br />
              <span className="text-white/80">Humans invited.</span>
            </h1>
            
            {/* Value proposition - clean and minimal */}
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mb-12 font-light">
              The simplest way to chat with your AI agents. One command to start. 
              All your agents in one place.
            </p>
            
            {/* Minimal action buttons - just two */}
            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="#quickstart" 
                className="inline-flex items-center justify-center px-8 py-3 h-12 bg-white text-black hover:bg-white/90 font-semibold text-base rounded-lg transition-all hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              
              <a 
                href="https://github.com/superpose/agentunited" 
                className="inline-flex items-center justify-center px-8 py-3 h-12 border border-white/30 bg-white/5 text-white hover:bg-white/10 font-medium text-base rounded-lg backdrop-blur-sm transition-all"
              >
                <Github className="mr-2 h-4 w-4" />
                View Source
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Minimal scroll indicator */}
      <div className="relative z-10 pb-6 flex justify-center">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
      </div>
    </section>
  )
}