import { invokeClinicalAI } from '@/lib/ai/provider';
import type { VoiceSessionState } from './types';

/**
 * Process voice input and generate AI response for real-time consultation
 */
export async function processVoiceInput(
  userTranscript: string,
  sessionContext: VoiceSessionState,
  patientInfo?: string
): Promise<string> {
  const conversationHistory = sessionContext.messages
    .slice(-10)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `You are a supportive clinical AI assistant during a doctor-patient consultation.
Your role is to:
1. Assist the doctor by providing relevant clinical suggestions
2. Help clarify patient symptoms and history
3. Suggest diagnostic considerations
4. Provide evidence-based clinical guidance

Patient Information: ${patientInfo || 'Not provided'}

Conversation Context:
${conversationHistory}

Provide brief, focused responses that support clinical decision-making. Keep responses under 100 words.`;

  const prompt = `Doctor/Patient just said: ${userTranscript}\n\nClinical AI Response:`;

  try {
    const { text } = await invokeClinicalAI({
      prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.3,
      modelTier: 'fast',
    });
    return text || 'Unable to process voice input';
  } catch (error) {
    console.error('[Voice] Error processing voice input:', error);
    throw error;
  }
}

/**
 * Generate real-time clinical notes from voice session
 */
export async function generateRealTimeNotes(
  transcript: string,
  _sessionContext: VoiceSessionState
): Promise<{
  keyFindings: string[];
  chiefComplaint: string;
  assessmentSummary: string;
}> {
  const prompt = `From this medical consultation transcript, extract:
1. Key clinical findings and symptoms
2. Chief complaint
3. Brief clinical assessment summary

Transcript:
${transcript}

Return as JSON:
{
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "chiefComplaint": "Main complaint",
  "assessmentSummary": "Brief 1-2 sentence assessment"
}`;

  try {
    const { text } = await invokeClinicalAI({
      prompt,
      maxTokens: 400,
      temperature: 0.3,
      modelTier: 'fast',
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      keyFindings: [],
      chiefComplaint: 'Unable to extract',
      assessmentSummary: 'Unable to generate',
    };
  } catch (error) {
    console.error('[Voice] Error generating real-time notes:', error);
    return {
      keyFindings: [],
      chiefComplaint: 'Error',
      assessmentSummary: 'Unable to process',
    };
  }
}

/**
 * Generate contextual clinical suggestions during consultation
 */
export async function getClinicaSuggestions(
  transcript: string,
  patientHistory: string,
  currentSymptoms: string
): Promise<string[]> {
  const prompt = `Based on the current consultation, provide 3-5 specific clinical suggestions for the doctor.

Patient History: ${patientHistory}
Current Symptoms: ${currentSymptoms}
Recent Transcript: ${transcript}

Provide actionable clinical suggestions as a JSON array:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

  try {
    const { text } = await invokeClinicalAI({
      prompt,
      maxTokens: 300,
      temperature: 0.4,
      modelTier: 'fast',
    });

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('[Voice] Error getting clinical suggestions:', error);
    return [];
  }
}

/**
 * Sentiment and clinical urgency analysis from transcript
 */
export async function analyzeSessionSentiment(transcript: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'concerning';
  urgency: 'high' | 'medium' | 'low';
  concerns: string[];
}> {
  const prompt = `Analyze this medical consultation transcript for:
1. Overall patient sentiment (positive/neutral/concerning)
2. Clinical urgency level
3. Any expressed concerns or red flags

Transcript:
${transcript}

Respond as JSON:
{
  "sentiment": "positive|neutral|concerning",
  "urgency": "high|medium|low",
  "concerns": ["Concern 1", "Concern 2"]
}`;

  try {
    const { text } = await invokeClinicalAI({
      prompt,
      maxTokens: 300,
      temperature: 0.3,
      modelTier: 'fast',
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      sentiment: 'neutral',
      urgency: 'medium',
      concerns: [],
    };
  } catch (error) {
    console.error('[Voice] Error analyzing session sentiment:', error);
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      concerns: [],
    };
  }
}
