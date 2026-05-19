import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '../components/LangSwitcher'

const Login: React.FC = () => {
  const { user, profile, signInWithGoogle, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.substring(1))
    const errorDescription = searchParams.get('error_description') || hashParams.get('error_description')
    const errorCode = searchParams.get('error_code') || hashParams.get('error_code')

    if (errorDescription) {
      toast(errorDescription.replace(/\+/g, ' '), 'error')
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (errorCode) {
      toast(`${t('login.failed')}: ${errorCode}`, 'error')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [location, toast, t])

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (!loading && user && !isRedirecting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRedirecting(true)
      if (profile?.username) {
        navigate('/inbox', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [user, profile, loading, navigate, isRedirecting])

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch {
      toast(t('login.failedToast'), 'error')
    }
  }

  // ✅ Show spinner while resolving — never flash login page to logged-in user
  if (loading || (user && isRedirecting)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute top-6 right-6">
        <LangSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-3xl bg-gray-900/50 p-8 border border-gray-800 animate-in fade-in slide-in-from-bottom-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black mb-2">{t('login.title')}</h1>
          <p className="text-gray-400">{t('login.subtitle')}</p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || isRedirecting}
          className="active-scale flex w-full items-center justify-center gap-4 rounded-2xl bg-white py-4 font-bold text-black transition-all hover:bg-gray-200 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('login.google')}
        </button>

        <p className="mt-8 text-center text-xs text-gray-600">
          {t('login.terms')}
        </p>
      </div>
    </div>
  )
}

export default Login