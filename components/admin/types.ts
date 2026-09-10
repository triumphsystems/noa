export interface DoctorItem {
  id: string;
  name: string;
  email: string;
  specialty: string;
  license: string;
  issuingAuthority: string | null;
  licenseDocumentUrl: string | null;
  clinic: string;
  careCode: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt: number | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  phone: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface AdminUser {
  id?: string;
  name?: string;
  email?: string;
  userType?: string;
}

export const REJECTION_PRESETS = [
  'Medical credentials could not be verified on the state medical board registry.',
  'Submitted medical license or credentials appear to be expired or invalid.',
  'Incomplete documentation: Medical license certificate could not be validated.',
  'Clinic affiliation and primary practice address could not be confirmed.',
] as const;

export function getDoctorInitials(name: string): string {
  const clean = name.replace(/^dr\.?\s+/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'MD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}