/**
 * Database Operations Tools for WebMCP
 * Exposes DynamoDB CRUD operations for patients, doctors, sessions, and intakes.
 */

import { WebMCPRegistry } from '../core/registry'
import {
  getPatientById,
  getPatientsByDoctor,
  createPatient,
  updatePatient,
  deletePatient,
  getDoctorById,
  getDoctorByEmail,
  updateDoctor,
  getSessionById,
  getSessionsByDoctor,
  getSessionsByPatient,
  createSession,
  updateSessionSoapNote,
  updateSessionTranscript,
  completeSession,
  getPatientIntake,
  savePatientIntake,
  Patient,
  Doctor,
  Session,
} from '@/lib/db'

export function registerDatabaseTools(registry: WebMCPRegistry): void {
  // ==========================================
  // Patient Tools
  // ==========================================

  // 1. get_patient_by_id
  registry.registerTool(
    {
      name: 'get_patient_by_id',
      description: 'Retrieves patient record including demographics, conditions, medications, and allergies by patient ID.',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: { type: 'string', description: 'Unique identifier of the patient.' },
        },
        required: ['patientId'],
      },
    },
    async (input) => {
      const patient = await getPatientById(input.patientId)
      if (!patient) throw new Error(`Patient not found with ID: "${input.patientId}"`)
      return { patient }
    }
  )

  // 2. list_doctor_patients
  registry.registerTool(
    {
      name: 'list_doctor_patients',
      description: 'Retrieves all registered patients associated with a specific doctor.',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Unique identifier of the doctor.' },
        },
        required: ['doctorId'],
      },
    },
    async (input) => {
      const patients = await getPatientsByDoctor(input.doctorId)
      return { count: patients.length, patients }
    }
  )

  // 3. create_new_patient
  registry.registerTool(
    {
      name: 'create_new_patient',
      description: 'Creates a new patient profile associated with a doctor.',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Doctor ID to assign patient to.' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          dateOfBirth: { type: 'string' },
          gender: { type: 'string' },
          address: { type: 'string' },
          allergies: { type: 'array', items: { type: 'string' } },
          medications: { type: 'array', items: { type: 'string' } },
          conditions: { type: 'array', items: { type: 'string' } },
        },
        required: ['doctorId', 'firstName', 'lastName', 'email'],
      },
    },
    async (input) => {
      const patient = await createPatient(input as Omit<Patient, 'id' | 'type' | 'createdAt' | 'updatedAt'>)
      return { success: true, patient }
    }
  )

  // 4. update_patient_record
  registry.registerTool(
    {
      name: 'update_patient_record',
      description: 'Updates demographic or clinical profile information for an existing patient.',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: { type: 'string', description: 'Patient ID to update.' },
          updates: {
            type: 'object',
            description: 'Fields to update (phone, address, allergies, medications, conditions).',
          },
        },
        required: ['patientId', 'updates'],
      },
    },
    async (input) => {
      const updated = await updatePatient(input.patientId, input.updates)
      return { success: true, patient: updated }
    }
  )

  // 5. delete_patient_record
  registry.registerTool(
    {
      name: 'delete_patient_record',
      description: 'Deletes a patient record from the clinical database.',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: { type: 'string', description: 'Patient ID to delete.' },
        },
        required: ['patientId'],
      },
    },
    async (input) => {
      const success = await deletePatient(input.patientId)
      return { success, patientId: input.patientId }
    }
  )

  // ==========================================
  // Doctor Tools
  // ==========================================

  // 6. get_doctor_profile
  registry.registerTool(
    {
      name: 'get_doctor_profile',
      description: 'Retrieves doctor profile details by doctor ID or email.',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Doctor ID.' },
          email: { type: 'string', description: 'Doctor email.' },
        },
      },
    },
    async (input) => {
      if (input.doctorId) {
        const doctor = await getDoctorById(input.doctorId)
        if (!doctor) throw new Error(`Doctor not found with ID: "${input.doctorId}"`)
        return { doctor }
      }
      if (input.email) {
        const doctor = await getDoctorByEmail(input.email)
        if (!doctor) throw new Error(`Doctor not found with email: "${input.email}"`)
        return { doctor }
      }
      throw new Error('Either doctorId or email must be provided')
    }
  )

  // 7. update_doctor_profile
  registry.registerTool(
    {
      name: 'update_doctor_profile',
      description: 'Updates doctor practice details (name, specialty, clinic, phone, avatar).',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Doctor ID.' },
          updates: {
            type: 'object',
            description: 'Fields to update (name, specialty, clinic, phone, avatar).',
          },
        },
        required: ['doctorId', 'updates'],
      },
    },
    async (input) => {
      const updated = await updateDoctor(input.doctorId, input.updates)
      return { success: true, doctor: updated }
    }
  )

  // 8. get_doctor_stats
  registry.registerTool(
    {
      name: 'get_doctor_stats',
      description: 'Calculates practice summary statistics (patient count, completed sessions, pending notes).',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Doctor ID.' },
        },
        required: ['doctorId'],
      },
    },
    async (input) => {
      const [patients, sessions] = await Promise.all([
        getPatientsByDoctor(input.doctorId),
        getSessionsByDoctor(input.doctorId),
      ])

      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

      const completed = sessions.filter(s => s.status === 'completed').length
      const active = sessions.filter(s => s.status === 'active').length
      const pendingNotes = sessions.filter(s => !s.soapNote).length
      const todaySessions = sessions.filter(s => s.startedAt >= startOfDay).length

      return {
        totalPatients: patients.length,
        totalSessions: sessions.length,
        completedSessions: completed,
        activeSessions: active,
        pendingNotes,
        todaySessions,
      }
    }
  )

  // ==========================================
  // Session Tools
  // ==========================================

  // 9. get_consultation_session
  registry.registerTool(
    {
      name: 'get_consultation_session',
      description: 'Retrieves consultation session metadata, transcript, and SOAP notes by session ID.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID.' },
        },
        required: ['sessionId'],
      },
    },
    async (input) => {
      const session = await getSessionById(input.sessionId)
      if (!session) throw new Error(`Session not found with ID: "${input.sessionId}"`)
      return { session }
    }
  )

  // 10. list_doctor_sessions
  registry.registerTool(
    {
      name: 'list_doctor_sessions',
      description: 'Lists all consultation sessions conducted by a doctor.',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Doctor ID.' },
        },
        required: ['doctorId'],
      },
    },
    async (input) => {
      const sessions = await getSessionsByDoctor(input.doctorId)
      return { count: sessions.length, sessions }
    }
  )

  // 11. create_consultation_session
  registry.registerTool(
    {
      name: 'create_consultation_session',
      description: 'Initializes a new consultation session between a doctor and a patient.',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: { type: 'string' },
          patientId: { type: 'string' },
        },
        required: ['doctorId', 'patientId'],
      },
    },
    async (input) => {
      const session = await createSession({
        doctorId: input.doctorId,
        patientId: input.patientId,
        startedAt: Date.now(),
        status: 'active',
      })
      return { success: true, session }
    }
  )

  // 12. update_session_soap_note
  registry.registerTool(
    {
      name: 'update_session_soap_note',
      description: 'Attaches or updates structured SOAP note for an existing consultation session.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          soapNote: {
            type: 'object',
            properties: {
              subjective: { type: 'string' },
              objective: { type: 'string' },
              assessment: { type: 'string' },
              plan: { type: 'string' },
            },
            required: ['subjective', 'objective', 'assessment', 'plan'],
          },
        },
        required: ['sessionId', 'soapNote'],
      },
    },
    async (input) => {
      const updated = await updateSessionSoapNote(input.sessionId, {
        ...input.soapNote,
        generatedAt: Date.now(),
      })
      return { success: true, session: updated }
    }
  )

  // 13. complete_consultation_session
  registry.registerTool(
    {
      name: 'complete_consultation_session',
      description: 'Marks a consultation session as completed and sets the end timestamp.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
        },
        required: ['sessionId'],
      },
    },
    async (input) => {
      const updated = await completeSession(input.sessionId)
      return { success: true, session: updated }
    }
  )

  // ==========================================
  // Intake Record Tools
  // ==========================================

  // 14. get_patient_intake_record
  registry.registerTool(
    {
      name: 'get_patient_intake_record',
      description: 'Retrieves patient intake history and questionnaire data by patient ID.',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
        },
        required: ['patientId'],
      },
    },
    async (input) => {
      const intake = await getPatientIntake(input.patientId)
      return { intake }
    }
  )

  // 15. save_patient_intake_record
  registry.registerTool(
    {
      name: 'save_patient_intake_record',
      description: 'Saves or updates completed patient intake questionnaire data.',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          medicalHistory: { type: 'string' },
          medications: { type: 'array', items: { type: 'string' } },
          allergies: { type: 'array', items: { type: 'string' } },
          surgeries: { type: 'string' },
          familyHistory: { type: 'string' },
          socialHistory: { type: 'string' },
          completed: { type: 'boolean' },
        },
        required: ['patientId', 'doctorId', 'medicalHistory'],
      },
    },
    async (input) => {
      const intake = await savePatientIntake(input as Parameters<typeof savePatientIntake>[0])
      return { success: true, intake }
    }
  )
}
