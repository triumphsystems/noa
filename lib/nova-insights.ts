import { invokeNovaModel, NOVA_PRO_MODEL, NOVA_LITE_MODEL } from './nova-client'

export async function generateClinicalInsights(
  patientHistory: string,
  currentPresentation: string,
  previousFindings?: string
): Promise<string> {
  const prompt = `As a clinical AI assistant, analyze the following patient information and provide clinical insights and recommendations.

Patient Medical History:
${patientHistory}

Current Presentation:
${currentPresentation}

${previousFindings ? `Previous Clinical Findings:\n${previousFindings}` : ''}

Provide:
1. Key clinical considerations
2. Recommended investigations or assessments
3. Differential diagnosis considerations
4. Clinical decision support recommendations
5. Patient education points

Format the response in clear, actionable clinical language.`

  try {
    return await invokeNovaModel(NOVA_PRO_MODEL, prompt, 1500, 0.5)
  } catch (error) {
    console.error('[v0] Error:', error)
    throw error
  }
}

export async function generatePatientSummary(soapNote: string, clinicalTerms?: string[]): Promise<string> {
  const prompt = `Convert the following clinical SOAP note into a patient-friendly summary. 
  
Use simple, clear language. Avoid medical jargon or explain it in parentheses.
Focus on: what was found, what it means for the patient, and what they need to do next.

SOAP Note:
${soapNote}

${clinicalTerms ? `Important terms to explain: ${clinicalTerms.join(', ')}` : ''}

Write a warm, reassuring summary that a patient can easily understand.`

  try {
    return await invokeNovaModel(NOVA_LITE_MODEL, prompt, 1000, 0.7)
  } catch (error) {
    console.error('[v0] Error:', error)
    throw error
  }
}
