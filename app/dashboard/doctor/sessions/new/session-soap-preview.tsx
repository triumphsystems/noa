import { Button } from '@/components/ui/button'

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SessionSOAPPreviewProps {
  soapNote: SOAPNote | null
  isGenerating: boolean
  onSave: () => void
}

export function SessionSOAPPreview({ soapNote, isGenerating, onSave }: SessionSOAPPreviewProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-deep-ink/10 sticky top-32">
      <h3 className="text-lg font-semibold font-serif mb-4">SOAP Note Preview</h3>

      {soapNote ? (
        <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
          {(['subjective', 'objective', 'assessment', 'plan'] as const).map(section => (
            <div key={section}>
              <h4 className="font-semibold text-deep-ink mb-1 capitalize">{section}</h4>
              <p className="text-slate text-xs leading-relaxed">{soapNote[section]}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate text-sm text-center py-8">SOAP note will appear after recording completes</p>
      )}

      {soapNote && (
        <Button
          onClick={onSave}
          disabled={isGenerating}
          className="w-full mt-4 rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 py-3 font-semibold"
        >
          {isGenerating ? 'Saving...' : 'Save Session'}
        </Button>
      )}
    </div>
  )
}
