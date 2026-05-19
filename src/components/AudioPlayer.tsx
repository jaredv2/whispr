import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [hasPlayed, setHasPlayed] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const onFirstPlayRef = useRef(onFirstPlay) // ✅ stable ref — no stale closure

  useEffect(() => { onFirstPlayRef.current = onFirstPlay }, [onFirstPlay])

  // ✅ Recreate audio element on src change — fixes stuck player on remount
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleCanPlay = () => setLoading(false)

    const handleTimeUpdate = () => {
      if (!isFinite(audio.duration) || audio.duration === 0) return
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
        setLoading(false)
      }
    }

    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(100) // ✅ stay at end, don't reset — feels more natural
      setCurrentTime(audio.duration)
    }

    const handleError = () => {
      console.error('Audio error:', audio.error?.code, audio.error?.message)
      setError(true)
      setIsPlaying(false)
      setLoading(false)
    }

    const handleStall = () => {
      // ✅ handle network stall — reload src
      if (!isPlaying) return
      audio.load()
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('stall', handleStall)

    audio.preload = 'metadata'
    audio.src = src

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('stall', handleStall)
    }
  }, [src]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || error || loading) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        // ✅ If ended, restart
        if (audio.ended || audio.currentTime >= audio.duration) {
          audio.currentTime = 0
          setProgress(0)
          setCurrentTime(0)
        }
        await audio.play()
        setIsPlaying(true)
        if (!hasPlayed) {
          setHasPlayed(true)
          onFirstPlayRef.current?.()
        }
      }
    } catch (err) {
      console.error('Playback failed:', err)
      setError(true)
    }
  }, [isPlaying, error, loading, hasPlayed])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !isFinite(audio.duration) || audio.duration === 0) return

    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    audio.currentTime = percent * audio.duration
    setProgress(percent * 100)
    setCurrentTime(audio.currentTime)
  }, [])

  const handleRestart = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setProgress(0)
    setCurrentTime(0)
  }, [])

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className={`flex items-center gap-3 rounded-xl bg-gray-900/50 p-4 ${className ?? ''}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
          <Play size={20} className="text-gray-600" />
        </div>
        <span className="text-xs text-gray-500">Audio unavailable</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 rounded-xl bg-gray-900/50 p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-4">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={loading}
          className="flex h-10 w-10 active-scale items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} className="ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Progress bar — touch + click seek */}
        <div className="flex flex-1 flex-col gap-1">
          <div
            ref={progressRef}
            className="relative h-3 w-full cursor-pointer rounded-full bg-gray-700"
            onClick={handleSeek}
            onTouchStart={handleSeek}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-purple-500 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            {/* ✅ Scrubber thumb */}
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-medium text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ✅ Restart button */}
        <button
          onClick={handleRestart}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:text-gray-400 transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}

export default AudioPlayer