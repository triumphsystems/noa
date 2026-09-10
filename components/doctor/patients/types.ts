import type { Patient } from '@/lib/db';

export interface InvitePatientFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface PatientActionNotification {
  type: 'success' | 'error';
  message: string;
}
