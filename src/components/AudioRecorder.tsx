import React, { useState } from 'react'
import { Mic, Square, Send, Trash2 } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import type { RecordingResult } from '../hooks/useAudioRecorder'
import WaveformVisualizer from './WaveformVisualizer'
import AudioPlayer from './AudioPlayer'
import { useToast } from './Toast'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, transcript: string, duration: number) => Promise<void>
  isSubmitting?: boolean
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isSubmitting }) => {
  const { 
    isRecording, 
    transcript, 
    duration, 
    stream, 
    startRecording, 
    stopRecording, 
    getRecording 
  } = useAudioRecorder()
  
  const [result, setResult] = useState<RecordingResult | null>(null)
  const [editedTranscript, setEditedTranscript] = useState('')
  const { toast } = useToast()

  const handleStart = async () => {
    try {
      setResult(null)
      await startRecording()
    } catch {
      toast('Could not access microphone', 'error')
    }
  }

  const handleStop = async () => {
    stopRecording()
    const recording = await getRecording()
    setResult(recording)
    setEditedTranscript(recording.transcript)
  }

  const handleSend = async () => {
    if (!result) return
    try {
      await onRecordingComplete(result.blob, editedTranscript, result.duration)
      setResult(null)
      setEditedTranscript('')
    } catch {
      toast('Failed to send message', 'error')
    }
  }

  const handleDiscard = () => {
    setResult(null)
    setEditedTranscript('')
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {!result ? (
        <div className="flex flex-col items-center gap-8">
          <WaveformVisualizer isRecording={isRecording} stream={stream} />
          
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={isRecording ? handleStop : handleStart}
              className={`flex h-20 w-20 active-scale items-center justify-center rounded-full shadow-lg transition-all ${
                isRecording 
                ? 'bg-red-500 animate-pulse ring-4 ring-red-500/20' 
                : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isRecording ? <Square size={32} fill="white" /> : <Mic size={32} fill="white" />}
            </button>
            <span className="text-sm font-medium text-gray-400">
              {isRecording ? `${duration}s / 60s` : 'Tap to record'}
            </span>
          </div>

          {isRecording && transcript && (
            <div className="w-full rounded-xl bg-gray-900/30 p-4 border border-gray-800 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm text-gray-400 italic">"{transcript}..."</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Preview</label>
            <AudioPlayer src={result.url} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Transcription</label>
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              placeholder="No transcript generated..."
              className="w-full rounded-xl bg-gray-900/50 p-4 text-sm text-white border border-gray-800 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              rows={3}
            />
            <p className="text-[10px] text-gray-500 italic">This is what we heard. You can edit it if needed.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="flex-1 active-scale flex items-center justify-center gap-2 rounded-xl border border-gray-800 py-4 font-semibold text-gray-400 transition-colors hover:bg-gray-900"
            >
              <Trash2 size={20} />
              Discard
            </button>
            <button
              onClick={handleSend}
              disabled={isSubmitting}
              className="flex-1 active-scale flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 font-semibold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send size={20} />
                  Send Whispr
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
