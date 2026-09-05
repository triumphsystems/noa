/**
 * Clinical Resources for WebMCP
 * Exposes standardized RFC 6570 URI templates and readers for patient records,
 * doctor profiles, consultation sessions, SOAP notes, and intake data.
 */

import { WebMCPRegistry } from '../core/registry';
import {
  getPatientById,
  getDoctorById,
  getPatientsByDoctor,
  getSessionById,
  getSessionsByDoctor,
  getSessionsByPatient,
  getPatientIntake,
} from '@/lib/db';

export function registerClinicalResources(registry: WebMCPRegistry): void {
  // Helper to verify caller has access to the given patient
  const assertPatientAccess = (patient: any, context?: any) => {
    if (!context?.userId && !context?.apiKey) {
      throw new Error(
        'Unauthorized: Authentication required to access clinical resources.'
      );
    }
    // If authenticated via server-to-server API key, allow access
    if (context?.apiKey) return;

    const { userId, userType, doctorId, patientId } = context;
    const isOwner = userId === patient.id || patientId === patient.id;
    const isAssignedDoctor =
      userId === patient.doctorId ||
      (doctorId && doctorId === patient.doctorId) ||
      (userType === 'doctor' && patient.doctorId === userId);

    if (!isOwner && !isAssignedDoctor) {
      throw new Error(
        'Forbidden: You do not have permission to view this patient resource.'
      );
    }
  };

  // Helper to verify caller has access to the given session
  const assertSessionAccess = (session: any, context?: any) => {
    if (!context?.userId && !context?.apiKey) {
      throw new Error(
        'Unauthorized: Authentication required to access session resources.'
      );
    }
    if (context?.apiKey) return;

    const { userId, doctorId, patientId } = context;
    const isParticipant =
      userId === session.doctorId ||
      userId === session.patientId ||
      (doctorId && doctorId === session.doctorId) ||
      (patientId && patientId === session.patientId);

    if (!isParticipant) {
      throw new Error(
        'Forbidden: You do not have permission to access this session resource.'
      );
    }
  };

  // Helper to verify caller has access to the doctor's data
  const assertDoctorAccess = (targetDoctorId: string, context?: any) => {
    if (!context?.userId && !context?.apiKey) {
      throw new Error(
        'Unauthorized: Authentication required to access doctor resources.'
      );
    }
    if (context?.apiKey) return;

    const { userId, doctorId } = context;
    const isSelf = userId === targetDoctorId || doctorId === targetDoctorId;

    if (!isSelf) {
      throw new Error(
        'Forbidden: You do not have permission to access this clinician resource.'
      );
    }
  };

  // 1. patient://{patientId}
  registry.registerResourceTemplate(
    {
      uriTemplate: 'patient://{patientId}',
      name: 'Patient Profile',
      description:
        'Demographics, allergies, medications, and medical conditions for a patient.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      const patient = await getPatientById(params.patientId);
      if (!patient) throw new Error(`Patient not found: ${params.patientId}`);
      assertPatientAccess(patient, context);
      return { patient };
    }
  );

  // 2. patient://{patientId}/history
  registry.registerResourceTemplate(
    {
      uriTemplate: 'patient://{patientId}/history',
      name: 'Patient Consultation History',
      description:
        'Chronological consultation sessions and care plans for a patient.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      const patient = await getPatientById(params.patientId);
      if (!patient) throw new Error(`Patient not found: ${params.patientId}`);
      assertPatientAccess(patient, context);

      const sessions = await getSessionsByPatient(params.patientId);
      return {
        patientId: params.patientId,
        totalSessions: sessions.length,
        sessions,
      };
    }
  );

  // 3. doctor://{doctorId}
  registry.registerResourceTemplate(
    {
      uriTemplate: 'doctor://{doctorId}',
      name: 'Doctor Profile',
      description:
        'Clinician credentials, specialty, clinic affiliation, and contact details.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      if (!context?.userId && !context?.apiKey) {
        throw new Error(
          'Unauthorized: Authentication required to access doctor profile.'
        );
      }
      const doctor = await getDoctorById(params.doctorId);
      if (!doctor) throw new Error(`Doctor not found: ${params.doctorId}`);
      return { doctor };
    }
  );

  // 4. doctor://{doctorId}/dashboard
  registry.registerResourceTemplate(
    {
      uriTemplate: 'doctor://{doctorId}/dashboard',
      name: 'Doctor Practice Dashboard',
      description:
        'Unified clinical dashboard including doctor profile, patient list, recent sessions, and metrics.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      assertDoctorAccess(params.doctorId, context);

      const [doctor, patients, sessions] = await Promise.all([
        getDoctorById(params.doctorId),
        getPatientsByDoctor(params.doctorId),
        getSessionsByDoctor(params.doctorId),
      ]);

      if (!doctor) throw new Error(`Doctor not found: ${params.doctorId}`);

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      return {
        doctor,
        patients,
        sessions,
        stats: {
          totalPatients: patients.length,
          totalSessions: sessions.length,
          completedSessions: sessions.filter((s) => s.status === 'completed')
            .length,
          activeSessions: sessions.filter((s) => s.status === 'active').length,
          pendingNotes: sessions.filter((s) => !s.soapNote).length,
          todaySessions: sessions.filter((s) => s.startedAt >= startOfDay)
            .length,
        },
      };
    }
  );

  // 5. session://{sessionId}
  registry.registerResourceTemplate(
    {
      uriTemplate: 'session://{sessionId}',
      name: 'Consultation Session',
      description:
        'Full consultation record including doctor, patient, status, timestamps, transcript, and SOAP note.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      const session = await getSessionById(params.sessionId);
      if (!session) throw new Error(`Session not found: ${params.sessionId}`);
      assertSessionAccess(session, context);
      return { session };
    }
  );

  // 6. session://{sessionId}/transcript
  registry.registerResourceTemplate(
    {
      uriTemplate: 'session://{sessionId}/transcript',
      name: 'Session Transcript',
      description:
        'Raw conversational audio transcript recorded during consultation.',
      mimeType: 'text/plain',
    },
    async (uri, params, context) => {
      const session = await getSessionById(params.sessionId);
      if (!session) throw new Error(`Session not found: ${params.sessionId}`);
      assertSessionAccess(session, context);
      return session.transcript || 'No transcript recorded for this session.';
    }
  );

  // 7. soap://{sessionId}
  registry.registerResourceTemplate(
    {
      uriTemplate: 'soap://{sessionId}',
      name: 'Clinical SOAP Note',
      description:
        'Structured clinical SOAP note (Subjective, Objective, Assessment, Plan) for a consultation session.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      const session = await getSessionById(params.sessionId);
      if (!session) throw new Error(`Session not found: ${params.sessionId}`);
      assertSessionAccess(session, context);
      if (!session.soapNote)
        throw new Error(
          `No SOAP note finalized for session: ${params.sessionId}`
        );
      return { sessionId: params.sessionId, soapNote: session.soapNote };
    }
  );

  // 8. intake://{patientId}
  registry.registerResourceTemplate(
    {
      uriTemplate: 'intake://{patientId}',
      name: 'Patient Health Intake Record',
      description:
        'Captured medical intake history, family history, lifestyle, and allergies.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      const patient = await getPatientById(params.patientId);
      if (!patient) throw new Error(`Patient not found: ${params.patientId}`);
      assertPatientAccess(patient, context);

      const intake = await getPatientIntake(params.patientId);
      if (!intake)
        throw new Error(
          `No intake record found for patient: ${params.patientId}`
        );
      return { intake };
    }
  );

  // 9. stats://doctor/{doctorId}
  registry.registerResourceTemplate(
    {
      uriTemplate: 'stats://doctor/{doctorId}',
      name: 'Doctor Performance Metrics',
      description:
        'Live aggregate statistics for clinical consultations and documentation completion.',
      mimeType: 'application/json',
    },
    async (uri, params, context) => {
      assertDoctorAccess(params.doctorId, context);

      const [patients, sessions] = await Promise.all([
        getPatientsByDoctor(params.doctorId),
        getSessionsByDoctor(params.doctorId),
      ]);

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      return {
        doctorId: params.doctorId,
        totalPatients: patients.length,
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s) => s.status === 'completed')
          .length,
        activeSessions: sessions.filter((s) => s.status === 'active').length,
        pendingNotes: sessions.filter((s) => !s.soapNote).length,
        todaySessions: sessions.filter((s) => s.startedAt >= startOfDay).length,
      };
    }
  );
}
