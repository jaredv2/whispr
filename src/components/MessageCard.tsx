import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'
import type { Database } from '../lib/database.types'
import AudioPlayer from './AudioPlayer'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

type Message = Database['public']['Tables']['messages']['Row']

interface MessageCardProps {
  message: Message
  onListened: (id: string) => void
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onListened }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(message.listened)
  const { t, i18n } = useTranslation()

  const dateLocale = i18n.language.startsWith('fr') ? fr : undefined

  const handlePlay = async () => {
    if (!hasPlayed) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('messages').update({ listened: true }).eq('id', message.id)
      if (!error) { setHasPlayed(true); onListened(message.id) }
    }
  }

  return (
    <div className={`relative flex flex-col gap-4 rounded-3xl bg-gray-900/40 p-5 border transition-all duration-300 ${!hasPlayed ? 'border-purple-500/30' : 'border-gray-800'}`}>
      {!hasPlayed && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: dateLocale })}
          </span>
          <span className="text-[10px] text-gray-600">
            {t('messageCard.seconds', { count: message.duration_seconds ?? 0 })}
          </span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400">
          <PlayCircle size={18} />
        </div>
      </div>

      <div onClick={handlePlay}>
        <AudioPlayer src={message.audio_url} />
      </div>

      {message.transcript && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-400 transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? t('messageCard.hideTranscript') : t('messageCard.showTranscript')}
          </button>
          {isExpanded && (
            <div className="rounded-xl bg-black/30 p-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-gray-400 italic leading-relaxed">"{message.transcript}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MessageCard