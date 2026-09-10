import {
  getDoctorById,
  getPatientsByDoctor,
  getPendingPatientsByDoctor,
  getSessionsByDoctor,
  computeDoctorCareCode,
  type Patient,
} from '@/lib/db';
import type {
  DoctorDashboardPayload,
  DoctorStats,
} from '@/lib/types/doctor.types';

/**
 * Server-side data fetcher for Doctor Dashboard.
 * Queries DynamoDB directly with zero HTTP network hops.
 */
export async function getDoctorData(
  doctorId: string
): Promise<DoctorDashboardPayload | null> {
  const doctor = await getDoctorById(doctorId);
  if (!doctor) return null;

  const [linkedPatients, pendingPatients, sessions] = await Promise.all([
    getPatientsByDoctor(doctorId),
    getPendingPatientsByDoctor(doctorId),
    getSessionsByDoctor(doctorId),
  ]);

  // Combine linked and pending patients with sanitized privacy rules for pending
  const patientMap = new Map<string, Patient>();
  linkedPatients.forEach((p) => patientMap.set(p.id, p));
  pendingPatients.forEach((p) => {
    if (!patientMap.has(p.id)) {
      const isFullyLinked =
        p.linkStatus === 'linked' && p.doctorId === doctorId;
      const sanitized: Patient = isFullyLinked
        ? p
        : {
            ...p,
            dateOfBirth: undefined,
            gender: undefined,
            phone: p.phone ? `${p.phone.slice(0, 3)}***` : undefined,
            address: undefined,
            allergies: [],
            medications: [],
            conditions: [],
          };
      patientMap.set(p.id, sanitized);
    }
  });

  const patients = Array.from(patientMap.values());
  const today = new Date();

  const stats: DoctorStats = {
    totalPatients: patients.length,
    totalSessions: sessions.length,
    completedSessions: sessions.filter(
      (session) => session.status === 'completed'
    ).length,
    activeSessions: sessions.filter((session) => session.status === 'active')
      .length,
    pendingNotes: sessions.filter(
      (session) => session.status === 'active' && !session.soapNote
    ).length,
    todaySessions: sessions.filter(
      (session) =>
        new Date(session.startedAt).toDateString() === today.toDateString()
    ).length,
  };

  const doctorWithCareCode = {
    ...doctor,
    careCode: computeDoctorCareCode(doctor),
  };

  return {
    doctor: doctorWithCareCode,
    patients,
    sessions: [...sessions].sort((a, b) => b.startedAt - a.startedAt),
    stats,
  };
}
