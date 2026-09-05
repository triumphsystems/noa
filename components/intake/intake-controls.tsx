'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Keyboard, RotateCcw, Send } from 'lucide-react';

type IntakeControlsProps = {
  isRecording: boolean;
  isSubmitting: boolean;
  onToggleMic: () => void;
  onSubmitText: (text: string) => void;
  onReset: () => void;
};

export function IntakeControls({
  isRecording,
  isSubmitting,
  onToggleMic,
  onSubmitText,
  onReset,
}: IntakeControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSubmitText(customText.trim());
    setCustomText('');
    setShowTextInput(false);
  };

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
            className="border-deep-ink/15 text-deep-ink placeholder:text-slate/60 focus:ring-deep-ink/20 flex-1 rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-1 focus:outline-none"
          />
          <Button
            type="submit"
            disabled={!customText.trim() || isSubmitting}
            variant="dark"
            className="rounded-xl px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowTextInput(false)}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
        </form>
      ) : null}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <Button
          onClick={onToggleMic}
          disabled={isSubmitting}
          className={`flex-1 gap-2 rounded-full px-6 py-4 text-sm font-semibold shadow-sm transition-all sm:text-base ${
            isRecording
              ? 'bg-deep-ink hover:bg-deep-ink/90 ring-hi-yellow/40 text-white ring-4'
              : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90'
          }`}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4 animate-pulse text-red-400 sm:h-5 sm:w-5" />
          ) : (
            <Mic className="text-deep-ink h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <span>{isRecording ? 'Stop microphone' : 'Start microphone'}</span>
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTextInput(!showTextInput)}
            className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow flex-1 gap-1.5 rounded-full text-xs sm:flex-initial sm:text-sm"
          >
            <Keyboard className="text-slate h-3.5 w-3.5" />
            <span>Type fallback</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow flex-1 gap-1.5 rounded-full text-xs sm:flex-initial sm:text-sm"
          >
            <RotateCcw className="text-slate h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
