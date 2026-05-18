import React from 'react'
import { Link } from 'react-router-dom'
import { Mic, Shield, Share2 } from 'lucide-react'

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center px-6 py-12 md:py-24">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]">
          <Mic size={32} className="text-white" fill="white" />
        </div>
        
        <h1 className="mb-4 text-5xl font-black tracking-tight md:text-7xl">
          Whispr<span className="text-purple-500">.</span>
        </h1>
        <p className="mb-8 text-lg font-medium text-gray-400 md:text-xl">
          Send anonymous voice notes to anyone. 
          No accounts needed for senders, full privacy for everyone.
        </p>

        <Link
          to="/login"
          className="active-scale rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:bg-gray-200"
        >
          Get your link
        </Link>
      </div>

      {/* Waveform Decoration */}
      <div className="mt-20 flex items-center gap-1 opacity-20 h-24">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-purple-500 animate-pulse-soft"
            style={{ 
              height: `${Math.random() * 80 + 20}%`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>

      {/* Features Grid */}
      <div className="mt-32 grid gap-12 md:grid-cols-3 max-w-5xl">
        <div className="flex flex-col items-center text-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
            <Shield size={24} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">100% Anonymous</h3>
          <p className="text-gray-400">Your identity is never revealed. No sender IDs, no tracking.</p>
        </div>

        <div className="flex flex-col items-center text-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
            <Share2 size={24} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">Share Anywhere</h3>
          <p className="text-gray-400">Get a unique link and share it on your bio or stories.</p>
        </div>

        <div className="flex flex-col items-center text-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
            <Mic size={24} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">Voice Only</h3>
          <p className="text-gray-400">The emotion of voice with the safety of anonymity.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-40 text-sm text-gray-600">
        © 2026 Whispr • Built for the quiet ones.
      </footer>
    </div>
  )
}

export default Landing
