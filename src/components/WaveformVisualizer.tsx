import React, { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isRecording: boolean
  stream?: MediaStream | null
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isRecording, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (isRecording && stream) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextClass()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      const draw = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return
        
        animationRef.current = requestAnimationFrame(draw)
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        ctx.clearRect(0, 0, width, height)

        const barWidth = (width / bufferLength) * 2.5
        let barHeight
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArrayRef.current[i] / 255) * height
          
          ctx.fillStyle = '#a855f7'
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }
      }

      draw()

      return () => {
        cancelAnimationFrame(animationRef.current)
        audioContext.close()
      }
    }
  }, [isRecording, stream])

  return (
    <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900/50">
      {!isRecording && (
        <div className="flex gap-1">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-1 animate-pulse-soft rounded-full bg-purple-500/30"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={isRecording ? 'block h-full w-full' : 'hidden'}
        width={300}
        height={100}
      />
    </div>
  )
}

export default WaveformVisualizer
