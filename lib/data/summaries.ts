import {
  getSessionById,
  getSessionsByDoctor,
  getPatientsByDoctor,
  getPatientById,
  getDoctorById,
  type Session,
  type Patient,
  type Doctor,
} from '@/lib/db';

export interface DoctorSummariesData {
  sessions: Session[];
  patients: Patient[];
}

/**
 * Direct DynamoDB fetcher for Doctor Summaries list.
 */
export async function getDoctorSummariesData(
  doctorId: string
): Promise<DoctorSummariesData> {
  const [sessions, patients] = await Promise.all([
    getSessionsByDoctor(doctorId),
    getPatientsByDoctor(doctorId),
  ]);

  return {
    sessions: [...sessions].sort(
      (a, b) => (b.startedAt || 0) - (a.startedAt || 0)
    ),
    patients,
  };
}

export interface DoctorSessionDetailData {
  session: Session;
  patient: Patient | null;
  doctor: Doctor | null;
}

/**
 * Direct DynamoDB fetcher for a single consultation session (Doctor view).
 */
export async function getDoctorSessionDetail(
  doctorId: string,
  sessionId: string
): Promise<DoctorSessionDetailData | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  if (session.doctorId !== doctorId) {
    return null; // Unauthorized to view another clinician's consultation
  }

  const [patient, doctor] = await Promise.all([
    session.patientId
      ? getPatientById(session.patientId)
      : Promise.resolve(null),
    getDoctorById(doctorId),
  ]);

  return {
    session,
    patient,
    doctor,
  };
}

export interface PatientSessionDetailData {
  session: Session;
  doctor: Doctor | null;
}

/**
 * Direct DynamoDB fetcher for a single consultation session (Patient view).
 */
export async function getPatientSessionDetail(
  patientId: string,
  sessionId: string
): Promise<PatientSessionDetailData | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  if (session.patientId !== patientId) {
    return null; // Unauthorized to view another patient's consultation
  }

  const doctor = session.doctorId
    ? await getDoctorById(session.doctorId)
    : null;

  return {
    session,
    doctor,
  };
}
