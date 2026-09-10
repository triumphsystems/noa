import { getAllDoctors, computeDoctorCareCode } from '@/lib/db';
import type { DoctorItem } from '@/components/admin/types';

export interface AdminDoctorsData {
  doctors: DoctorItem[];
  counts: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
}

/**
 * Server-side data fetcher for Admin Dashboard.
 * Queries DynamoDB directly with zero HTTP roundtrips.
 */
export async function getAdminDoctorsData(): Promise<AdminDoctorsData> {
  const allDoctors = await getAllDoctors();

  const counts = {
    pending: allDoctors.filter(
      (d) => (d.verificationStatus || 'pending') === 'pending'
    ).length,
    verified: allDoctors.filter((d) => d.verificationStatus === 'verified')
      .length,
    rejected: allDoctors.filter((d) => d.verificationStatus === 'rejected')
      .length,
    total: allDoctors.length,
  };

  const doctors: DoctorItem[] = allDoctors.map((doc) => ({
    id: doc.id,
    name: doc.name,
    email: doc.email,
    specialty: doc.specialty,
    license: doc.license,
    issuingAuthority: doc.issuingAuthority || null,
    licenseDocumentUrl: doc.licenseDocumentUrl || null,
    clinic: doc.clinic,
    careCode: computeDoctorCareCode(doc),
    verificationStatus: doc.verificationStatus || 'pending',
    verifiedAt: doc.verifiedAt || null,
    verifiedBy: doc.verifiedBy || null,
    rejectionReason: doc.rejectionReason || null,
    phone: doc.phone || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return {
    doctors,
    counts,
  };
}
