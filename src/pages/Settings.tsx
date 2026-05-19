import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { ChevronLeft, Camera, Trash2, User, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Settings: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setAvatarFile(file); setAvatarUrl(URL.createObjectURL(file)) }
  }

  const handleSave = async () => {
    if (!profile) return
    setIsSubmitting(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${profile.id}/${profile.id}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars').upload(fileName, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = publicUrl
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('profiles')
        .update({ display_name: displayName, bio, avatar_url: finalAvatarUrl })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast(t('settings.profileUpdated'), 'success')
      navigate('/inbox')
    } catch (err) {
      console.error('Update error:', err)
      toast(t('common.error'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAllMessages = async () => {
    if (!profile) return
    setIsDeleting(true)
    try {
      type MessageAudioRow = { id: string; audio_url: string }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: messages, error: fetchError } = await (supabase as any)
        .from('messages')
        .select('id, audio_url')
        .eq('recipient_id', profile.id) as { data: MessageAudioRow[] | null, error: unknown }
      if (fetchError) throw fetchError

      if (messages && messages.length > 0) {
        const storagePaths = messages.map((m) => {
          try {
            const url = new URL(m.audio_url)
            const parts = url.pathname.split('/voice-messages/')
            return parts[1] ?? null
          } catch { return null }
        }).filter((p): p is string => p !== null)

        if (storagePaths.length > 0) {
          await supabase.storage.from('voice-messages').remove(storagePaths)
        }
      }

      const { error: deleteError } = await supabase
        .from('messages').delete().eq('recipient_id', profile.id)
      if (deleteError) throw deleteError

      toast(t('settings.deleteSuccess'), 'success')
      setConfirmDelete(false)
      navigate('/inbox')
    } catch (err) {
      console.error('Delete error:', err)
      toast(t('common.error'), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-10 flex items-center justify-between">
        <Link to="/inbox" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-black">{t('settings.title')}</h1>
        <div className="w-10" />
      </header>

      <main className="flex flex-col gap-10 pb-20">
        <section className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative h-24 w-24">
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-purple-500/50 bg-gray-900">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-gray-700"><User size={48} /></div>
                }
              </div>
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-purple-600 p-2 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">@{profile?.username}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2">{t('settings.displayName')}</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('settings.displayName')}
                className="w-full rounded-2xl bg-gray-900/50 p-5 font-bold border border-gray-800 focus:outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2">{t('settings.bio')}</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder={t('settings.bioPlaceholder')}
                className="w-full rounded-2xl bg-gray-900/50 p-5 text-sm border border-gray-800 focus:outline-none focus:border-purple-500 transition-all resize-none"
                rows={3} />
            </div>
          </div>

          <button onClick={handleSave} disabled={isSubmitting}
            className="active-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-5 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50">
            {isSubmitting
              ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <><Save size={20} />{t('common.save')}</>
            }
          </button>
        </section>

        <hr className="border-gray-900" />

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 ml-2">{t('settings.dangerZone')}</h3>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="active-scale flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-5 font-bold text-red-500 transition-all hover:bg-red-500/10">
              <Trash2 size={20} />{t('settings.deleteAll')}
            </button>
          ) : (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 space-y-4">
              <p className="text-sm text-red-400 text-center font-medium">{t('settings.deleteConfirm')}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl border border-gray-700 py-3 text-sm font-bold text-gray-400 hover:bg-gray-900">
                  {t('common.cancel')}
                </button>
                <button onClick={handleDeleteAllMessages} disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                  {isDeleting
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : t('settings.deleteYes')
                  }
                </button>
              </div>
            </div>
          )}

          <button onClick={() => signOut()}
            className="active-scale w-full rounded-2xl border border-gray-800 py-5 font-bold text-gray-500 transition-all hover:bg-gray-900 hover:text-white">
            {t('common.signOut')}
          </button>
        </section>
      </main>
    </div>
  )
}

export default Settings