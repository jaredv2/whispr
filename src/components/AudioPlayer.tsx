import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  className?: string
  onFirstPlay?: () => void
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className, onFirstPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Reset state when src changes
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    setError(false)

    const handleTimeUpdate = () => {
      if (!isFinite(audio.duration)) return
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    // Some browsers fire durationchange after loadedmetadata
    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = () => {
      console.error('Audio error:', audio.error?.message, 'src:', src)
      setError(true)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [src])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || error) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
        if (!hasPlayed) {
          setHasPlayed(true)
          onFirstPlay?.()
        }
      }
    } catch (err) {
      console.error('Playback failed:', err)
      setError(true)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !isFinite(audio.duration)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * audio.duration
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className={`flex items-center gap-3 rounded-xl bg-gray-900/50 p-4 ${className}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
          <Play size={20} className="text-gray-600" />
        </div>
        <span className="text-xs text-gray-500">Audio unavailable</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 rounded-xl bg-gray-900/50 p-4 ${className}`}>
      {/* Multiple sources for cross-browser support */}
      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/webm" />
        <source src={src} type="audio/ogg" />
        <source src={src} type="audio/mp4" />
      </audio>

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 active-scale items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700"
        >
          {isPlaying
            ? <Pause size={20} fill="currentColor" />
            : <Play size={20} className="ml-0.5" fill="currentColor" />
          }
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <div
            className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-gray-700"
            onClick={handleSeek}
          >
            <div
              className="absolute left-0 top-0 h-full bg-purple-500 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-medium text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer