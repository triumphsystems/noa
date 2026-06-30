import { invokeAIModel } from './ai-gateway-service'

export async function generateRealTimeNotes(
  transcript: string
): Promise<{
  keyFindings: string[]
  chiefComplaint: string
  assessmentSummary: string
}> {
  const prompt = `From this medical consultation transcript, extract:
1. Key clinical findings and symptoms
2. Chief complaint
3. Brief clinical assessment summary

Transcript:
${transcript}

Return as JSON:
{
  "keyFindings": ["Finding 1", "Finding 2"],
  "chiefComplaint": "Main complaint",
  "assessmentSummary": "Brief assessment"
}`

  try {
    const text = await invokeBedrockModel(prompt, 400, 0.3)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : text)
  } catch (error) {
    console.error('[v0] Error:', error)
    return {
      keyFindings: [],
      chiefComplaint: 'Unable to extract',
      assessmentSummary: 'Unable to process',
    }
  }
}

export async function getClinicaSuggestions(
  transcript: string,
  patientHistory: string,
  currentSymptoms: string
): Promise<string[]> {
  const prompt = `Based on the current consultation, provide 3-5 specific clinical suggestions.

Patient History: ${patientHistory}
Current Symptoms: ${currentSymptoms}
Recent Transcript: ${transcript}

Return as JSON array: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`

  try {
    const text = await invokeBedrockModel(prompt, 300, 0.4)
    const arrayMatch = text.match(/\[[\s\S]*\]/)
    return JSON.parse(arrayMatch ? arrayMatch[0] : '[]')
  } catch (error) {
    console.error('[v0] Error:', error)
    return []
  }
}

export async function analyzeSessionSentiment(
  transcript: string
): Promise<{
  sentiment: 'positive' | 'neutral' | 'concerning'
  urgency: 'high' | 'medium' | 'low'
  concerns: string[]
}> {
  const prompt = `Analyze this medical consultation transcript for:
1. Patient sentiment (positive/neutral/concerning)
2. Clinical urgency level
3. Any expressed concerns or red flags

Transcript:
${transcript}

Return as JSON:
{
  "sentiment": "positive|neutral|concerning",
  "urgency": "high|medium|low",
  "concerns": ["Concern 1"]
}`

  try {
    const text = await invokeBedrockModel(prompt, 300, 0.3)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : text)
  } catch (error) {
    console.error('[v0] Error:', error)
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      concerns: [],
    }
  }
}

export async function processVoiceInput(userTranscript: string, conversationHistory: string, patientInfo?: string): Promise<string> {
  const systemPrompt = `You are a clinical AI assistant during a doctor-patient consultation. 
Your role is to:
1. Assist the doctor by providing relevant clinical suggestions
2. Help clarify patient symptoms and history
3. Suggest diagnostic considerations
4. Provide evidence-based clinical guidance

Patient Information: ${patientInfo || 'Not provided'}

Conversation:
${conversationHistory}

Provide brief, focused responses under 100 words.`

  const prompt = `${systemPrompt}\n\nDoctor/Patient just said: ${userTranscript}\n\nClinical AI Response:`

  try {
    return await invokeBedrockModel(prompt, 500, 0.3)
  } catch (error) {
    console.error('[v0] Error:', error)
    throw error
  }
}
