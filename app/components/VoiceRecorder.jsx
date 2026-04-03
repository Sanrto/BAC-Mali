'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const MAX_AUDIO_SECONDS = 30

function formatSeconds(value) {
  const safe = Math.max(0, Math.floor(value || 0))
  const min = String(Math.floor(safe / 60)).padStart(2, '0')
  const sec = String(safe % 60).padStart(2, '0')
  return `${min}:${sec}`
}

export default function VoiceRecorder({ disabled = false, onAudioReady, onClear, existingDuration = 0, premium = false }) {
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const label = useMemo(() => {
    if (!premium) return 'Réservé aux membres Premium'
    if (recording) return `Enregistrement… ${formatSeconds(seconds)} / ${formatSeconds(MAX_AUDIO_SECONDS)}`
    if (previewUrl) return `Audio prêt (${formatSeconds(existingDuration || seconds)})`
    return `Message vocal max ${MAX_AUDIO_SECONDS}s`
  }, [recording, seconds, previewUrl, existingDuration, premium])

  async function startRecording() {
    if (disabled || !premium) return
    setError('')

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Votre navigateur ne supporte pas l’enregistrement vocal.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      setSeconds(0)
      setRecording(true)

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size) {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          onAudioReady?.({ file, duration: seconds || existingDuration || 0, mimeType: 'audio/webm' })
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      recorder.start()
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev + 1 >= MAX_AUDIO_SECONDS) {
            stopRecording()
            return MAX_AUDIO_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Impossible d’accéder au micro.')
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  function clearAudio() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setSeconds(0)
    setError('')
    onClear?.()
  }

  return (
    <div style={{ marginTop: 10, border: '1px dashed var(--paper-2)', borderRadius: 14, padding: 12, background: 'var(--paper)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 13, color: 'var(--ink)' }}>🎙️ Vocal Premium</strong>
        <span style={{ fontSize: 12, color: premium ? 'var(--ink-3)' : '#7C3AED' }}>{label}</span>
      </div>

      {previewUrl && (
        <audio controls src={previewUrl} style={{ width: '100%', marginBottom: 8 }} />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || !premium}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--paper-2)', background: premium ? 'white' : '#F3E8FF', color: premium ? 'var(--ink)' : '#7C3AED', cursor: disabled || !premium ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 }}
          >
            ⏺️ Enregistrer
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', cursor: 'pointer' }}
          >
            ⏹️ Stop
          </button>
        )}

        <button
          type="button"
          onClick={clearAudio}
          disabled={!previewUrl}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--paper-2)', background: 'white', color: 'var(--ink-3)', cursor: !previewUrl ? 'not-allowed' : 'pointer', opacity: previewUrl ? 1 : 0.5 }}
        >
          🗑️ Retirer l’audio
        </button>
      </div>

      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#B91C1C' }}>{error}</div>}
    </div>
  )
}
