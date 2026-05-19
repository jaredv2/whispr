import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Shield, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '../components/LangSwitcher'
import { useAuth } from '../hooks/useAuth'

const Landing: React.FC = () => {
  const { t } = useTranslation()
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  // ✅ Redirect logged-in users away from landing
  useEffect(() => {
    if (!loading && user) {
      if (profile?.username) {
        navigate('/inbox', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [user, profile, loading, navigate])

  // ✅ Don't flash landing page while auth resolves
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  // ✅ Don't render landing if user is logged in (redirect is in flight)
  if (user) return null

  return (
    <div className="flex flex-col items-center px-6 py-12 md:py-24">
      <div className="absolute top-6 right-6">
        <LangSwitcher />
      </div>

      <div className="flex flex-col items-center text-center max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]">
          <Mic size={32} className="text-white" fill="white" />
        </div>
        <h1 className="mb-4 text-5xl font-black tracking-tight md:text-7xl">
          Whispr<span className="text-purple-500">.</span>
        </h1>
        <p className="mb-8 text-lg font-medium text-gray-400 md:text-xl">
          {t('landing.tagline')}
        </p>
        <Link
          to="/login"
          className="active-scale rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:bg-gray-200"
        >
          {t('landing.cta')}
        </Link>
      </div>

      <div className="mt-20 flex items-center gap-1 opacity-20 h-24">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-purple-500 animate-pulse-soft"
            // eslint-disable-next-line react-hooks/purity
            style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>

      <div className="mt-32 grid gap-12 md:grid-cols-3 max-w-5xl">
        <div className="flex flex-col items-center text-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
            <Shield size={24} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">{t('landing.feature1Title')}</h3>
          <p className="text-gray-400">{t('landing.feature1Sub')}</p>
        </div>
        <div className="flex flex-col items-center text-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
            <Share2 size={24} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">{t('landing.feature2Title')}</h3>
          <p className="text-gray-400">{t('landing.feature2Sub')}</p>
        </div>
        <div className="flex flex-col items-center text-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 transition-colors">
            <Mic size={24} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">{t('landing.feature3Title')}</h3>
          <p className="text-gray-400">{t('landing.feature3Sub')}</p>
        </div>
      </div>

      <footer className="mt-40 text-sm text-gray-600">
        {t('landing.footer')}
      </footer>
    </div>
  )
}

export default Landing