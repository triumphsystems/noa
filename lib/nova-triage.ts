import { invokeNovaModel, NOVA_LITE_MODEL } from './nova-client'

export async function generateTriagePriority(
  chiefComplaint: string,
  symptoms: string,
  vitalSigns?: string
): Promise<{
  priority: 'emergent' | 'urgent' | 'routine'
  reason: string
  recommendations: string[]
}> {
  const prompt = `As a clinical triage nurse, evaluate this patient presentation and assign a triage priority.

Chief Complaint: ${chiefComplaint}
Symptoms: ${symptoms}
${vitalSigns ? `Vital Signs: ${vitalSigns}` : ''}

Respond in JSON format:
{
  "priority": "emergent" | "urgent" | "routine",
  "reason": "Brief reason for priority assignment",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}

Base priority on:
- EMERGENT: Life-threatening, immediate risk, severe symptoms
- URGENT: Significant symptoms, needs prompt evaluation, risk of deterioration
- ROUTINE: Stable, mild-moderate symptoms, can wait for scheduled appointment`

  try {
    const text = await invokeNovaModel(NOVA_LITE_MODEL, prompt, 500, 0.2)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      priority: 'routine',
      reason: 'Unable to evaluate',
      recommendations: [],
    }
  } catch (error) {
    console.error('[v0] Error:', error)
    return {
      priority: 'routine',
      reason: 'Error in evaluation',
      recommendations: [],
    }
  }
}

export async function generateFollowUpPlan(
  assessment: string,
  medications: string[],
  procedures?: string[]
): Promise<string> {
  const prompt = `Based on the clinical assessment, generate a structured follow-up care plan.

Clinical Assessment: ${assessment}
Current Medications: ${medications.join(', ')}
${procedures ? `Procedures: ${procedures.join(', ')}` : ''}

Create a follow-up plan that includes:
1. Follow-up appointment timing (1-2 weeks, 1 month, 3 months, etc.)
2. Monitoring parameters
3. When to seek immediate care
4. Medication management
5. Lifestyle modifications
6. Patient education topics

Format as a clear, actionable plan.`

  try {
    return await invokeNovaModel(NOVA_LITE_MODEL, prompt, 1200, 0.5)
  } catch (error) {
    console.error('[v0] Error:', error)
    throw error
  }
}
