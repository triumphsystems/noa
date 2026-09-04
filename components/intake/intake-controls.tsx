'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Keyboard, RotateCcw, Send } from 'lucide-react'

type IntakeControlsProps = {
  isRecording: boolean
  isSubmitting: boolean
  onToggleMic: () => void
  onSubmitText: (text: string) => void
  onReset: () => void
}

export function IntakeControls({
  isRecording,
  isSubmitting,
  onToggleMic,
  onSubmitText,
  onReset,
}: IntakeControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false)
  const [customText, setCustomText] = useState('')

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customText.trim()) return
    onSubmitText(customText.trim())
    setCustomText('')
    setShowTextInput(false)
  }

  return (
    <div className="space-y-3">
      {showTextInput ? (
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type your response here..."
            autoFocus
            className="flex-1 rounded-xl border border-deep-ink/15 px-3.5 py-2.5 text-sm text-deep-ink placeholder:text-slate/60 focus:outline-none focus:ring-1 focus:ring-deep-ink/20 bg-white"
          />
          <Button type="submit" disabled={!customText.trim() || isSubmitting} variant="dark" className="rounded-xl px-4">
            <Send className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowTextInput(false)} className="rounded-xl text-xs">
            Cancel
          </Button>
        </form>
      ) : null}

      <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row">
        <Button
          onClick={onToggleMic}
          disabled={isSubmitting}
          className={`flex-1 rounded-full px-6 py-4 text-sm sm:text-base font-semibold gap-2 transition-all shadow-sm ${
            isRecording
              ? 'bg-deep-ink text-white hover:bg-deep-ink/90 ring-4 ring-hi-yellow/40'
              : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 animate-pulse" />
          ) : (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-deep-ink" />
          )}
          <span>{isRecording ? 'Stop microphone' : 'Start microphone'}</span>
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 sm:flex-initial rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-xs sm:text-sm gap-1.5"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate" />
            <span>Type fallback</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="flex-1 sm:flex-initial rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-xs sm:text-sm gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate" />
            <span>Reset</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
