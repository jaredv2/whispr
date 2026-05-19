import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import MessageCard from '../components/MessageCard'
import ShareButton from '../components/ShareButton'
import { Settings, LogOut, User, Ghost } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LangSwitcher from '../components/LangSwitcher'

type Message = Database['public']['Tables']['messages']['Row']

const Inbox: React.FC = () => {
  const { profile, signOut } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    if (!profile) return
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages').select('*')
        .eq('recipient_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) console.error('Error fetching messages:', error)
      else setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()

    const channel = supabase
      .channel(`inbox:${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${profile.id}` },
        (payload) => setMessages((prev) => [payload.new as Message, ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${profile.id}` },
        (payload) => setMessages((prev) => prev.filter((m) => m.id !== payload.old.id)))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const handleListened = (id: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, listened: true } : msg)))
  }

  const unreadCount = messages.filter((m) => !m.listened).length
  const shareUrl = `${window.location.origin}/u/${profile?.username}`

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-full border border-purple-500/30 bg-gray-900">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-gray-700"><User size={24} /></div>
            }
          </div>
          <div>
            <h2 className="text-lg font-black leading-tight">{profile?.display_name}</h2>
            <p className="text-xs text-gray-500">@{profile?.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <LangSwitcher />
          <Link to="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors">
            <Settings size={20} />
          </Link>
          <button onClick={() => signOut()} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <section className="mb-12 rounded-3xl bg-purple-600/10 p-6 border border-purple-500/20">
        <h3 className="mb-1 text-sm font-bold">{t('inbox.yourLink')}</h3>
        <p className="mb-4 text-xs text-gray-400">{t('inbox.linkHint')}</p>
        <div className="mb-4 overflow-hidden rounded-xl bg-black/40 p-4 font-mono text-xs text-purple-400 break-all border border-purple-500/20">
          {shareUrl}
        </div>
        <ShareButton url={shareUrl} className="w-full text-sm py-3" />
      </section>

      <main className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black">{t('inbox.title')}</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold text-gray-500 border border-gray-800 uppercase tracking-widest">
            {t('inbox.total', { count: messages.length })}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-gray-900/50 border border-gray-800" />
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div className="grid gap-4 pb-12">
            {messages.map((msg) => <MessageCard key={msg.id} message={msg} onListened={handleListened} />)}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-6 rounded-full bg-gray-900 p-8 border border-gray-800 text-gray-700">
              <Ghost size={64} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-gray-400">{t('inbox.empty')}</h4>
            <p className="max-w-[200px] text-sm text-gray-600">{t('inbox.emptyHint')}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Inbox