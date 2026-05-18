import React from 'react'
import { Share2, Copy } from 'lucide-react'
import { useToast } from './Toast'

interface ShareButtonProps {
  url: string
  title?: string
  text?: string
  className?: string
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  url, 
  title = 'Whispr', 
  text = 'Send me an anonymous voice message!', 
  className 
}) => {
  const { toast } = useToast()

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast('Link copied to clipboard!', 'success')
      } catch (err) {
        toast('Failed to copy link', 'error')
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`active-scale flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 ${className}`}
    >
      {typeof navigator.share !== 'undefined' ? <Share2 size={20} /> : <Copy size={20} />}
      <span>Share Link</span>
    </button>
  )
}

export default ShareButton
