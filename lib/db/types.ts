export type DoctorVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Doctor {
  id: string;
  type: 'doctor';
  email: string;
  name: string;
  specialty: string;
  license: string;
  issuingAuthority?: string;
  licenseDocumentUrl?: string;
  clinic: string;
  careCode?: string;
  verificationStatus: DoctorVerificationStatus;
  verifiedAt?: number;
  verifiedBy?: string;
  rejectionReason?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Patient {
  id: string;
  type: 'patient';
  doctorId?: string;
  pendingDoctorId?: string;
  linkStatus?:
    | 'linked'
    | 'pending_patient_approval'
    | 'pending_doctor_approval'
    | 'unlinked';
  linkRequestedBy?: 'doctor' | 'patient';
  linkRequestedAt?: number;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  avatar?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  generatedAt: number;
}

export interface Session {
  id: string;
  type: 'session';
  doctorId: string;
  patientId: string;
  startedAt: number;
  endedAt?: number;
  transcript?: string;
  audioUrl?: string;
  realTimeNotes?: unknown;
  status: 'active' | 'completed' | 'archived';
  soapNote?: SoapNote;
  createdAt: number;
  updatedAt: number;
}

export interface PatientIntake {
  id: string;
  type: 'intake';
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
  summary?: string;
  medicalHistory: string;
  medications: string[];
  allergies: string[];
  surgeries?: string;
  familyHistory?: string;
  socialHistory?: string;
  completed: boolean;
  completedAt?: number;
  draft?: Record<string, unknown>;
  ttl?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface AdminUser {
  id: string;
  type: 'admin';
  email: string;
  name: string;
  role: 'superadmin' | 'clinical_admin';
  createdAt: number;
  updatedAt: number;
}

export type UserRecord = Doctor | Patient | AdminUser;
