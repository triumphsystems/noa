import { invokeNovaModel, extractSection, NOVA_LITE_MODEL } from './nova-client'

export async function generateSOAPWithNova(
  transcript: string,
  patientContext?: string
): Promise<{
  subjective: string
  objective: string
  assessment: string
  plan: string
}> {
  const systemPrompt = `You are a clinical documentation expert. Convert the following medical consultation transcript into a structured SOAP note.
  
Patient Context: ${patientContext || 'N/A'}

Format your response EXACTLY as follows:
SUBJECTIVE:
[Chief complaint and history of present illness]

OBJECTIVE:
[Vital signs, physical examination, test results]

ASSESSMENT:
[Clinical impressions and diagnoses]

PLAN:
[Treatment plan, medications, follow-up]`

  const prompt = `${systemPrompt}\n\nConsultation Transcript:\n${transcript}`

  try {
    const text = await invokeNovaModel(NOVA_LITE_MODEL, prompt, 2000, 0.3)

    return {
      subjective: extractSection(text, 'SUBJECTIVE'),
      objective: extractSection(text, 'OBJECTIVE'),
      assessment: extractSection(text, 'ASSESSMENT'),
      plan: extractSection(text, 'PLAN'),
    }
  } catch (error) {
    console.error('[v0] Error:', error)
    throw error
  }
}
