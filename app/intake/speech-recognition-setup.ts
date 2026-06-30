type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: {
    resultIndex: number
    results: Array<{ isFinal: boolean; 0: { transcript: string } }>
  }) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export function createSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null

  const recognitionCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!recognitionCtor) return null

  const recognition = new recognitionCtor()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = true
  recognition.maxAlternatives = 1

  return recognition
}

export function processRecognitionResult(
  event: any,
  committedRef: React.MutableRefObject<string>,
  onInterim: (text: string) => void
) {
  let finalText = ''
  let interimText = ''

  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const transcript = event.results[i][0]?.transcript || ''
    if (event.results[i].isFinal) finalText += transcript
    else interimText += transcript
  }

  if (finalText.trim()) {
    committedRef.current = `${committedRef.current} ${finalText}`.trim()
  }

  onInterim(`${committedRef.current} ${interimText}`.trim())
}
