/**
 * Web Speech API speech synthesis fallback
 */
export function speakWithBrowserSynthesis(
  text: string,
  language = 'English',
  onSpeakingChange?: (speaking: boolean) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language.toLowerCase().startsWith('es')
      ? 'es-ES'
      : 'en-US';

    utterance.onstart = () => onSpeakingChange?.(true);
    utterance.onend = () => onSpeakingChange?.(false);
    utterance.onerror = () => onSpeakingChange?.(false);

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[BrowserSpeech] SpeechSynthesis error:', err);
    onSpeakingChange?.(false);
  }
}

export function stopBrowserSynthesis(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel error
    }
  }
}

/**
 * Creates and starts a browser SpeechRecognition instance if supported
 */
export function startBrowserSpeechRecognition({
  language,
  onInterim,
  onFinalTurn,
}: {
  language: string;
  onInterim: (text: string) => void;
  onFinalTurn: (text: string) => void;
}): any | null {
  if (typeof window === 'undefined') return null;
  const Win = window as any;
  const SpeechRecognitionCtor =
    Win.SpeechRecognition || Win.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) return null;

  try {
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language.toLowerCase().startsWith('es')
      ? 'es-ES'
      : 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTurn = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript || '';
        if (res.isFinal) {
          finalTurn += ' ' + text;
        } else {
          interim += ' ' + text;
        }
      }
      if (finalTurn.trim()) {
        onFinalTurn(finalTurn.trim());
      }
      if (interim.trim()) {
        onInterim(interim.trim());
      }
    };

    recognition.onerror = (err: any) => {
      if (err?.error !== 'no-speech') {
        console.warn('[BrowserSpeech] SpeechRecognition error:', err?.error);
      }
    };

    recognition.start();
    return recognition;
  } catch (err) {
    console.warn('[BrowserSpeech] Could not start speech recognition:', err);
    return null;
  }
}
