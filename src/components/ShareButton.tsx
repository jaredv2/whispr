import React from 'react'
import { Share2, Copy } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useTranslation } from 'react-i18next'

interface ShareButtonProps {
  url: string
  className?: string
}

const ShareButton: React.FC<ShareButtonProps> = ({ url, className }) => {
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Whispr', text: t('share.text'), url })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast(t('share.copied'), 'success')
      } catch {
        toast(t('share.copyFailed'), 'error')
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`active-scale flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 ${className ?? ''}`}
    >
      {typeof navigator.share !== 'undefined' ? <Share2 size={20} /> : <Copy size={20} />}
      <span>{t('share.button')}</span>
    </button>
  )
}

export default ShareButton