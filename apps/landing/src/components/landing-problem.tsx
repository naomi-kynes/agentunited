import { Terminal, MessageSquare, CheckCircle, X, AlertTriangle } from 'lucide-react'

export function LandingProblem() {
  return (
    <section className="relative py-32 bg-transparent">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Enterprise narrative hook */}
        <div className="text-center mb-24 animate-fade-in-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">The Reality</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-10 leading-tight tracking-tight">
            You built an amazing agent.{' '}
            <br className="hidden md:block" />
            <span className="text-white/50">Now what?</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed font-light">
            Most people end up frustrated with solutions that weren't designed for simple agent communication.
          </p>
        </div>

        {/* Enterprise comparison cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20 animate-fade-in-up animation-delay-200">
          {/* Terminal Chat - Problem */}
          <div className="group relative bg-red-500/10 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20 hover:border-red-500/30 transition-all duration-500 hover:scale-105">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/25">
              <X className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300">
                <Terminal className="w-9 h-9 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Terminal Chat</h3>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="flex items-start text-white/70">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Conversations disappear when you close the window</span>
              </div>
              <div className="flex items-start text-white/70">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">No chat history or search</span>
              </div>
              <div className="flex items-start text-white/70">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Can't multitask or switch between agents</span>
              </div>
            </div>
            
            <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-red-500/30">
              <p className="text-red-300 font-semibold text-lg italic">
                "Not built for this"
              </p>
            </div>
          </div>

          {/* Discord Bots - Problem */}
          <div className="group relative bg-red-500/10 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20 hover:border-red-500/30 transition-all duration-500 hover:scale-105">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/25">
              <X className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-9 h-9 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Discord Bots</h3>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="flex items-start text-white/70">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Complex OAuth and permissions setup</span>
              </div>
              <div className="flex items-start text-white/70">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Fighting a platform not built for agents</span>
              </div>
              <div className="flex items-start text-white/70">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Overkill for personal use</span>
              </div>
            </div>
            
            <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-red-500/30">
              <p className="text-red-300 font-semibold text-lg italic">
                "Just want to chat"
              </p>
            </div>
          </div>

          {/* AgentUnited - Solution */}
          <div className="group relative bg-emerald-500/10 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/30 hover:border-emerald-400/50 shadow-2xl shadow-emerald-500/10 transform scale-105 hover:scale-110 transition-all duration-500">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-9 h-9 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">AgentUnited</h3>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="flex items-start text-white/80">
                <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed font-medium">One command setup — that's it</span>
              </div>
              <div className="flex items-start text-white/80">
                <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed font-medium">Beautiful chat interface with full history</span>
              </div>
              <div className="flex items-start text-white/80">
                <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 mr-4 flex-shrink-0" />
                <span className="leading-relaxed font-medium">Purpose-built for agents, not teams</span>
              </div>
            </div>
            
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-emerald-400/30">
              <p className="text-emerald-300 font-bold text-lg">
                "Finally, simple"
              </p>
            </div>
          </div>
        </div>
        
        {/* Enterprise transition to solution */}
        <div className="text-center animate-fade-in-up animation-delay-400">
          <div className="relative bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 lg:p-16 border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 rounded-3xl" />
            <div className="relative z-10">
              <p className="text-2xl lg:text-3xl text-white/90 leading-relaxed mb-8 font-light">
                <strong className="text-white font-semibold">Sound familiar?</strong> You spent hours building an amazing agent, 
                then got stuck trying to have a simple conversation with it. 
              </p>
              <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent mb-8">
                There's a better way.
              </div>
              <a 
                href="#how-it-works" 
                className="group inline-flex items-center justify-center px-10 py-5 bg-white text-black font-bold text-lg rounded-2xl shadow-2xl hover:shadow-white/30 transition-all duration-500 hover:scale-105"
              >
                Show Me How
                <CheckCircle className="w-6 h-6 ml-3 transition-transform group-hover:rotate-12 duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}