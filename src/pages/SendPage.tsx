import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { useToast } from '../contexts/ToastContext'
import AudioRecorder from '../components/AudioRecorder'
import { User, Check, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Profile = Database['public']['Tables']['profiles']['Row']

const SendPage: React.FC = () => {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSent, setIsSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return
      try {
        const { data, error } = await supabase
          .from('profiles').select('*')
          .eq('username', username.toLowerCase()).single()
        if (error) throw error
        setProfile(data)
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  const handleRecordingComplete = async (blob: Blob, transcript: string, duration: number) => {
    if (!profile) return
    if (blob.size === 0) { toast(t('send.emptyRecording'), 'error'); return }
    if (blob.size > 10_000_000) { toast(t('send.tooLarge'), 'error'); return }
    if (duration > 60) { toast(t('send.tooLong'), 'error'); return }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'voice.webm')
      formData.append('recipient_id', profile.id)
      formData.append('transcript', transcript.replace(/<[^>]*>/g, '').slice(0, 1000))
      formData.append('duration', String(duration))

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? t('send.failedError'))

      setIsSent(true)
      toast(t('send.successToast'), 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('send.failedError')
      toast(message, 'error')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-black mb-4">{t('send.notFound')}</h1>
        <p className="text-gray-400 mb-8">{t('send.notFoundSub')}</p>
        <Link to="/" className="rounded-full bg-white px-8 py-3 font-bold text-black transition-all hover:bg-gray-200">
          {t('send.goHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12 md:py-24">
      <div className="w-full max-w-md">
        {!isSent ? (
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8">
            <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-2 border-purple-500/30 bg-gray-900 shadow-xl">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.display_name ?? ''} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-gray-700"><User size={48} /></div>
              }
            </div>
            <h1 className="mb-1 text-2xl font-black">{profile.display_name}</h1>
            <p className="mb-8 text-sm text-gray-500">@{profile.username}</p>
            {profile.bio && (
              <p className="mb-12 text-gray-400 text-sm bg-gray-900/30 p-4 rounded-2xl border border-gray-800">{profile.bio}</p>
            )}
            <AudioRecorder onRecordingComplete={handleRecordingComplete} isSubmitting={isSubmitting} />
            <p className="mt-12 text-xs text-gray-600">{t('send.anonymous')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-20 animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 shadow-[0_0_50px_-5px_rgba(168,85,247,0.6)]">
              <Check size={48} className="text-white" strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-black mb-4">{t('send.sent')}</h1>
            <p className="text-lg text-gray-400 mb-12">{t('send.sentSub')}</p>
            <div className="flex flex-col w-full gap-4">
              <button onClick={() => setIsSent(false)} className="active-scale flex items-center justify-center gap-2 rounded-2xl border border-gray-800 py-5 font-bold text-white hover:bg-gray-900 transition-colors">
                <Mic size={20} />{t('send.sendAnother')}
              </button>
              <Link to="/" className="active-scale rounded-2xl bg-white py-5 font-bold text-black transition-all hover:bg-gray-200">
                {t('send.createOwn')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SendPage