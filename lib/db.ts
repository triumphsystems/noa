// Re-export types
export type { Doctor, Patient, Session, SoapNote, PatientIntake } from './db-types'

// Re-export doctor operations
export { createDoctor, getDoctorById, getDoctorByEmail, updateDoctor } from './db-doctors'

// Re-export patient operations
export { createPatient, getPatientById, getPatientsByDoctor, updatePatient } from './db-patients'

// Re-export session operations
export { createSession, getSessionById, getSessionsByDoctor, getSessionsByPatient, updateSession } from './db-sessions'

// Re-export intake operations
export { createIntake, getIntakeById, getIntakesByPatient, updateIntake } from './db-intakes'

// Re-export table config
export { TABLE_NAME } from './db-client'
