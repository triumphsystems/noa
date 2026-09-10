export interface DoctorOnboardingFormData {
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  license: string;
  issuingAuthority: string;
  licenseDocumentUrl: string;
}

export interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}
