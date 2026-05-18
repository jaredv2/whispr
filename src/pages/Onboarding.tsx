import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Camera, Check, ChevronRight, User } from 'lucide-react'
import ShareButton from '../components/ShareButton'

import type { Database } from '../lib/database.types'

type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

const Onboarding: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()

  // Redirect if profile already complete
  useEffect(() => {
    if (profile && profile.username) {
      navigate('/inbox', { replace: true })
    }
  }, [profile, navigate])

  // Real-time username check
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setIsUsernameAvailable(null)
        return
      }
      setIsCheckingUsername(true)
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle()

      setIsUsernameAvailable(!data)
      setIsCheckingUsername(false)
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [username])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const handleComplete = async () => {
    if (!user || !isUsernameAvailable) return
    setIsSubmitting(true)

    try {
      let uploadedAvatarUrl: string | null = null

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/${user.id}-${Math.random()}.${fileExt}` // ✅ folder prefix for RLS

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        uploadedAvatarUrl = publicUrl
      }

    const payload: ProfileInsert = {
      id: user.id,
      username: username.toLowerCase(),
      display_name: displayName || username,
      bio,
      avatar_url: uploadedAvatarUrl,
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(payload)

      if (error) throw error

      await refreshProfile()
      setStep(4)
    } catch (err) {
      console.error('Onboarding error:', err)
      toast('Failed to save profile', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const shareUrl = `${window.location.origin}/u/${username}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Progress Bar */}
        {step < 4 && (
          <div className="mb-12 flex justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-[30%] rounded-full transition-colors duration-500 ${
                  step >= s ? 'bg-purple-600' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Username */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h1 className="text-3xl font-black mb-2">Pick a username.</h1>
              <p className="text-gray-400">This will be your unique Whispr link.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '')) // ✅ fixed regex
                }
                placeholder="username"
                className="w-full rounded-2xl bg-gray-900/50 p-5 text-xl font-bold border border-gray-800 focus:outline-none focus:border-purple-500 transition-all text-center"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                )}
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <Check className="text-green-500" size={24} />
                )}
                {!isCheckingUsername && isUsernameAvailable === false && (
                  <span className="text-xs font-bold text-red-500">Taken</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!isUsernameAvailable}
              className="active-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-5 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:grayscale"
            >
              Continue
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Profile Details */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h1 className="text-3xl font-black mb-2">Tell us more.</h1>
              <p className="text-gray-400">Add a display name and a short bio.</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-full rounded-2xl bg-gray-900/50 p-5 font-bold border border-gray-800 focus:outline-none focus:border-purple-500 transition-all"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio (optional)"
                className="w-full rounded-2xl bg-gray-900/50 p-5 text-sm border border-gray-800 focus:outline-none focus:border-purple-500 transition-all resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="active-scale flex-1 rounded-2xl border border-gray-800 py-5 font-bold text-gray-400"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="active-scale flex-[2] rounded-2xl bg-purple-600 py-5 font-bold text-white transition-all hover:bg-purple-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Avatar */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-center">
            <div>
              <h1 className="text-3xl font-black mb-2">One last thing.</h1>
              <p className="text-gray-400">Add an avatar so people know it's you.</p>
            </div>

            <div className="relative mx-auto h-32 w-32">
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-purple-500/50 bg-gray-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-700">
                    <User size={64} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-purple-600 p-2 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="flex gap-4 pt-8">
              <button
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="active-scale flex-1 rounded-2xl border border-gray-800 py-5 font-bold text-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="active-scale flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-5 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success / Share */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 text-center">
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-[0_0_40px_-5px_rgba(34,197,94,0.4)]">
                <Check size={40} className="text-white" strokeWidth={3} />
              </div>
              <h1 className="text-4xl font-black mb-2">You're ready!</h1>
              <p className="text-gray-400">Your Whispr link is live. Share it to start receiving voices.</p>
            </div>

            <div className="rounded-3xl bg-gray-900/50 p-6 border border-gray-800">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Your link</p>
              <div className="mb-6 rounded-xl bg-black/40 p-4 font-mono text-purple-400 break-all border border-purple-500/20">
                {shareUrl}
              </div>
              <ShareButton url={shareUrl} className="w-full" />
            </div>

            <button
              onClick={() => navigate('/inbox')}
              className="active-scale w-full rounded-2xl bg-white py-5 font-bold text-black transition-all hover:bg-gray-200"
            >
              Go to Inbox
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default Onboarding