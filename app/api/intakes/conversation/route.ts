import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

import { createIntake, getDoctorByCareCode, getDoctorById } from '@/lib/db'
import {
  generateIntakeConversationTurn,
  type IntakeConversationDraft,
  type IntakeConversationMessage,
} from '@/lib/voice-service'

function mergeStringArrays(existing: string[] = [], incoming: string[] = []) {
  return Array.from(new Set([...existing, ...incoming].map(item => item.trim()).filter(Boolean)))
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
    const language = typeof body.language === 'string' && body.language ? body.language : 'English'
    const history = Array.isArray(body.history) ? (body.history as IntakeConversationMessage[]) : []
    const draft = (body.draft || {}) as IntakeConversationDraft
    const doctorInput = typeof body.doctorId === 'string' ? body.doctorId.trim() : ''
    const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : ''

    if (!transcript) {
      return NextResponse.json({ message: 'transcript is required' }, { status: 400 })
    }

    const result = await generateIntakeConversationTurn({
      transcript,
      language,
      history,
      draft,
    })

    let savedIntake = null

    if (result.isComplete && doctorInput && patientId) {
      // Resolve doctor whether doctorInput was an ID or Care Code
      let resolvedDoctorId = doctorInput
      if (!doctorInput.startsWith('doctor-')) {
        const doc = await getDoctorByCareCode(doctorInput)
        if (doc) resolvedDoctorId = doc.id
      }

      savedIntake = await createIntake({
        patientId,
        doctorId: resolvedDoctorId,
        completed: Boolean(result.isComplete),
        completedAt: result.isComplete ? Date.now() : undefined,
        medicalHistory: [
          result.draft.medicalConditions?.length ? `Conditions: ${result.draft.medicalConditions.join(', ')}` : '',
          result.draft.familyHistory ? `Family history: ${result.draft.familyHistory}` : '',
          result.draft.surgeries ? `Surgeries: ${result.draft.surgeries}` : '',
          result.draft.smokingStatus ? `Smoking: ${result.draft.smokingStatus}` : '',
          result.draft.alcoholUse ? `Alcohol: ${result.draft.alcoholUse}` : '',
          result.draft.exerciseFrequency ? `Exercise: ${result.draft.exerciseFrequency}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
        medications: result.draft.currentMedications || [],
        allergies: result.draft.allergies || [],
        surgeries: result.draft.surgeries || '',
        familyHistory: result.draft.familyHistory || '',
        socialHistory: [
          result.draft.smokingStatus ? `Smoking: ${result.draft.smokingStatus}` : '',
          result.draft.alcoholUse ? `Alcohol: ${result.draft.alcoholUse}` : '',
          result.draft.exerciseFrequency ? `Exercise: ${result.draft.exerciseFrequency}` : '',
          result.draft.address ? `Address: ${result.draft.address}` : '',
          result.draft.emergencyContactName ? `Emergency contact: ${result.draft.emergencyContactName}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      })
    }

    const responseDraft = {
      ...draft,
      ...result.draft,
      medicalConditions: mergeStringArrays(draft.medicalConditions, result.draft.medicalConditions),
      allergies: mergeStringArrays(draft.allergies, result.draft.allergies),
      currentMedications: mergeStringArrays(draft.currentMedications, result.draft.currentMedications),
    }

    return NextResponse.json({
      success: true,
      turn: {
        assistantMessage: result.assistantMessage,
        detectedLanguage: result.detectedLanguage,
        normalizedTranscript: result.normalizedTranscript,
        draft: responseDraft,
        missingFields: result.missingFields,
        isComplete: result.isComplete,
        summary: result.summary,
      },
      savedIntake,
    })
  } catch (error) {
    console.error('Error handling intake conversation:', error)
    return NextResponse.json(
      {
        message: 'Failed to process intake conversation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
