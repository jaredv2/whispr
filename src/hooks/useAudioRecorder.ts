import { useState, useRef, useCallback } from 'react'

export interface RecordingResult {
  blob: Blob
  url: string
  transcript: string
  duration: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
}
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition }
    webkitSpeechRecognition: { new(): SpeechRecognition }
  }
}

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const transcriptRef = useRef('') // ✅ ref so getRecording always sees latest value
  const durationRef = useRef(0)   // ✅ same for duration

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)

    // ✅ Stop recorder FIRST — let onstop handle stream cleanup
    recorder.stop()
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(audioStream)

      // Pick best supported mime type
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(
        (m) => MediaRecorder.isTypeSupported(m)
      ) ?? ''

      const mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      transcriptRef.current = ''
      durationRef.current = 0
      setTranscript('')
      setDuration(0)

      // ✅ timeslice = 100ms — data flows continuously, not just at end
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      // ✅ Stream killed AFTER data is fully flushed in onstop
      mediaRecorder.onstop = () => {
        audioStream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }

      // Speech recognition
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) {
        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = true

          // With this:
        recognition.lang = navigator.language || 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let current = ''
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript
          }
          setTranscript(current)
          transcriptRef.current = current // ✅ keep ref in sync
        }

        recognitionRef.current = recognition
        try { recognition.start() } catch (err) {
          console.warn('Speech recognition failed to start:', err)
        }
      }

      mediaRecorder.start(100) // ✅ timeslice — flush every 100ms
      startTimeRef.current = Date.now()
      setIsRecording(true)

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(elapsed)
        durationRef.current = elapsed
        if (elapsed >= 60) stopRecording()
      }, 1000)

    } catch (err) {
      console.error('Failed to start recording:', err)
      throw err
    }
  }, [stopRecording])

  const getRecording = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current
      if (!recorder) return reject(new Error('No recorder'))

      const buildResult = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })

        // ✅ Guard against empty blob
        if (blob.size === 0) {
          return reject(new Error('Empty recording — no audio data captured'))
        }

        const url = URL.createObjectURL(blob)
        resolve({
          blob,
          url,
          transcript: transcriptRef.current, // ✅ use ref, not stale state
          duration: durationRef.current,
        })
      }

      // ✅ If already stopped, build immediately
      if (recorder.state === 'inactive') {
        buildResult()
      } else {
        // stop hasn't fired yet — wait for it
        recorder.addEventListener('stop', buildResult, { once: true })
      }
    })
  }, [])

  return {
    isRecording,
    transcript,
    duration,
    stream,
    startRecording,
    stopRecording,
    getRecording,
  }
}