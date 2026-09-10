import {
  getPatientById,
  getDoctorById,
  getSessionsByPatient,
  getIntakesByPatient,
} from '@/lib/db';
import type {
  PatientDashboardPayload,
  PatientStats,
} from '@/lib/types/patient.types';

/**
 * Server-side data fetcher for Patient Dashboard.
 * Queries DynamoDB directly with zero HTTP network hops.
 */
export async function getPatientData(
  patientId: string
): Promise<PatientDashboardPayload | null> {
  const patient = await getPatientById(patientId);
  if (!patient) return null;

  const [doctor, pendingDoctor, sessions, intakes] = await Promise.all([
    patient.doctorId ? getDoctorById(patient.doctorId) : Promise.resolve(null),
    patient.pendingDoctorId
      ? getDoctorById(patient.pendingDoctorId)
      : Promise.resolve(null),
    getSessionsByPatient(patientId),
    getIntakesByPatient(patientId),
  ]);

  const sortedSessions = [...sessions].sort(
    (a, b) => (b.startedAt || 0) - (a.startedAt || 0)
  );
  const latestIntake = intakes[0] || null;

  const stats: PatientStats = {
    totalConsultations: sessions.length,
    completedConsultations: sessions.filter((s) => s.status === 'completed')
      .length,
    activeConsultations: sessions.filter((s) => s.status === 'active').length,
    hasIntake: Boolean(latestIntake),
  };

  return {
    patient,
    doctor,
    pendingDoctor,
    sessions: sortedSessions,
    intake: latestIntake,
    stats,
  };
}
