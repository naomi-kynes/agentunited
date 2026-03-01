'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-overlay">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-liberty-green rounded-md flex items-center justify-center">
              {/* Simplified Statue of Liberty torch icon */}
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-deep-slate tracking-tight">
              AgentUnited
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="#features" 
              className="text-deep-slate hover:text-liberty-green transition-colors font-medium"
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-deep-slate hover:text-liberty-green transition-colors font-medium"
            >
              How It Works
            </Link>
            <Link 
              href="#quickstart" 
              className="text-deep-slate hover:text-liberty-green transition-colors font-medium"
            >
              Quickstart
            </Link>
            <Link 
              href="#docs" 
              className="text-deep-slate hover:text-liberty-green transition-colors font-medium"
            >
              Docs
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="https://github.com/superpose/agentunited" className="flex items-center space-x-2">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Link>
            </Button>
            <Button size="sm" className="btn-primary">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}