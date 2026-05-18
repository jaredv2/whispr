import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { ChevronLeft, Camera, Trash2, User, Save } from 'lucide-react'

const Settings: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setIsSubmitting(true)

    try {
      let finalAvatarUrl = avatarUrl

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${profile.id}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        finalAvatarUrl = publicUrl
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          display_name: displayName,
          bio,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', profile.id)

      if (error) throw error

      await refreshProfile()
      toast('Profile updated successfully', 'success')
      navigate('/inbox')
    } catch (err) {
      console.error('Update error:', err)
      toast('Failed to update profile', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAllMessages = async () => {
    if (!profile) return
    if (!window.confirm('Are you sure you want to delete ALL your voice messages? This cannot be undone.')) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('recipient_id', profile.id)

      if (error) throw error
      toast('All messages deleted', 'success')
      navigate('/inbox')
    } catch (err) {
      toast('Failed to delete messages', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <Link
          to="/inbox"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-black">Settings</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex flex-col gap-10 pb-20">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative h-24 w-24">
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-purple-500/50 bg-gray-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-700">
                    <User size={48} />
                  </div>
                )}
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-full rounded-2xl bg-gray-900/50 p-5 font-bold border border-gray-800 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people what to say..."
                className="w-full rounded-2xl bg-gray-900/50 p-5 text-sm border border-gray-800 focus:outline-none focus:border-purple-500 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="active-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-5 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </section>

        <hr className="border-gray-900" />

        {/* Danger Zone */}
        <section className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 ml-2">Danger Zone</h3>
          
          <button
            onClick={handleDeleteAllMessages}
            disabled={isDeleting}
            className="active-scale flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-5 font-bold text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            ) : (
              <>
                <Trash2 size={20} />
                Delete All Messages
              </>
            )}
          </button>

          <button
            onClick={() => signOut()}
            className="active-scale w-full rounded-2xl border border-gray-800 py-5 font-bold text-gray-500 transition-all hover:bg-gray-900 hover:text-white"
          >
            Sign Out
          </button>
        </section>
      </main>
    </div>
  )
}

export default Settings
