import {
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { docClient, TABLE_NAME, PK, SK } from './client';
import { buildUpdateExpression } from './update-expression';
import type { Doctor, DoctorVerificationStatus } from './types';

export async function createDoctor(
  data: Omit<Doctor, 'id' | 'type' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  }
): Promise<Doctor> {
  const doctor: Doctor = {
    id: data.id || nanoid(),
    type: 'doctor',
    ...data,
    verificationStatus: data.verificationStatus || 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: doctor,
    })
  );

  return doctor;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'doctor' },
    })
  );

  return (result.Item as Doctor) || null;
}

export async function isDoctorVerified(doctorId: string): Promise<boolean> {
  const doctor = await getDoctorById(doctorId);
  return Boolean(doctor && doctor.verificationStatus === 'verified');
}

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':email': email,
        ':type': 'doctor',
      },
    })
  );

  const item = result.Items?.[0];
  if (!item?.id) return null;
  return await getDoctorById(item.id);
}

export async function updateDoctor(
  id: string,
  updates: Partial<Doctor>
): Promise<Doctor | null> {
  const {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  } = buildUpdateExpression(updates as Record<string, unknown>);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'doctor' },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as Doctor) || null;
}

export function computeDoctorCareCode(doctor: Doctor): string {
  if (doctor.careCode) return doctor.careCode;
  const suffix = doctor.id
    .replace('doctor-', '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `NOA-${suffix || 'DOC'}`;
}

export async function getAllDoctors(): Promise<Doctor[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':type': 'doctor',
        },
        Limit: 100,
      })
    );
    const doctors = (result.Items || []) as Doctor[];
    return doctors.map((doc) => ({
      ...doc,
      careCode: doc.careCode || computeDoctorCareCode(doc),
    }));
  } catch (err) {
    console.error('[DB] Error fetching all doctors:', err);
    return [];
  }
}

export async function searchDoctors(queryStr: string): Promise<Doctor[]> {
  const query = (queryStr || '').trim().toLowerCase();
  if (!query) return [];

  const doctors = await getAllDoctors();
  return doctors.filter((doc) => {
    const nameMatch = (doc.name || '').toLowerCase().includes(query);
    const specialtyMatch = (doc.specialty || '').toLowerCase().includes(query);
    const clinicMatch = (doc.clinic || '').toLowerCase().includes(query);
    const emailMatch = (doc.email || '').toLowerCase().includes(query);
    const codeMatch =
      (doc.careCode || '')
        .toLowerCase()
        .includes(query.replace(/[^a-zA-Z0-9]/g, '')) ||
      (doc.careCode || '').toLowerCase() === query;

    return (
      nameMatch || specialtyMatch || clinicMatch || emailMatch || codeMatch
    );
  });
}

export async function getDoctorByCareCode(
  codeStr: string
): Promise<Doctor | null> {
  const code = (codeStr || '').trim().toLowerCase();
  if (!code) return null;

  if (code.includes('@')) {
    return await getDoctorByEmail(code);
  }

  if (code.startsWith('doctor-')) {
    return await getDoctorById(code);
  }

  const doctors = await getAllDoctors();
  return (
    doctors.find((doc) => {
      const computed = (
        doc.careCode || computeDoctorCareCode(doc)
      ).toLowerCase();
      return (
        computed === code ||
        computed.replace('noa-', '') === code.replace('noa-', '')
      );
    }) || null
  );
}

export async function getDoctorsByVerificationStatus(
  status: DoctorVerificationStatus
): Promise<Doctor[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type AND verificationStatus = :status',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':type': 'doctor',
          ':status': status,
        },
        Limit: 100,
      })
    );
    const doctors = (result.Items || []) as Doctor[];
    return doctors.map((doc) => ({
      ...doc,
      careCode: doc.careCode || computeDoctorCareCode(doc),
    }));
  } catch (err) {
    console.error('[DB] Error fetching doctors by verification status:', err);
    return [];
  }
}

export async function updateDoctorVerification(
  id: string,
  status: DoctorVerificationStatus,
  adminId: string,
  rejectionReason?: string
): Promise<Doctor | null> {
  const updates: Record<string, any> = {
    verificationStatus: status,
    verifiedBy: adminId,
  };

  if (status === 'verified') {
    updates.verifiedAt = Date.now();
    updates.rejectionReason = null;
  } else if (status === 'rejected') {
    updates.rejectionReason =
      rejectionReason?.trim() ||
      'Medical credentials could not be verified with the issuing authority.';
    updates.verifiedAt = null;
  } else {
    updates.rejectionReason = null;
    updates.verifiedAt = null;
  }

  return updateDoctor(id, updates as Partial<Doctor>);
}
