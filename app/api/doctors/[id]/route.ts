import { NextRequest } from 'next/server';

import type {
  DoctorProfile,
  DoctorProfileUpdateInput,
} from '@/lib/types/doctor.types';
import { getDoctorById, updateDoctor, type Doctor } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { doctorProfileUpdateSchema } from '@/lib/validations';
import {
  apiError,
  apiSuccess,
  handleApiError,
  zodValidationError,
} from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    if (!id) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Doctor ID is required',
        400
      );
    }

    const doctor = await getDoctorById(id);

    if (!doctor) {
      return apiError(API_ERROR_CODES.NOT_FOUND, 'Doctor not found', 404);
    }

    return apiSuccess<DoctorProfile>(doctor);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch doctor');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const { id } = await params;

    // RBAC: Doctors can only edit their own profile; admins can edit any
    if (auth.userType === 'doctor' && auth.sub !== id) {
      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        'Forbidden: You can only edit your own profile',
        403
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = doctorProfileUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'At least one profile field is required'
      );
    }

    const body = parseResult.data;

    // Whitelist allowed fields to prevent arbitrary writes
    const updates: Partial<Doctor> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.specialty !== undefined) updates.specialty = body.specialty;
    if (body.clinic !== undefined) updates.clinic = body.clinic;
    if (body.address !== undefined) updates.address = body.address;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.avatar !== undefined) updates.avatar = body.avatar;

    // If license details are updated, reset verification to pending
    if (
      body.license !== undefined ||
      body.issuingAuthority !== undefined ||
      body.licenseDocumentUrl !== undefined
    ) {
      if (body.license !== undefined) updates.license = body.license;
      if (body.issuingAuthority !== undefined)
        updates.issuingAuthority = body.issuingAuthority;
      if (body.licenseDocumentUrl !== undefined)
        updates.licenseDocumentUrl = body.licenseDocumentUrl;

      // Resubmitting credentials resets status to 'pending' for re-review
      updates.verificationStatus = 'pending';
      updates.rejectionReason = '';
    }

    const updatedDoctor = await updateDoctor(id, updates);

    if (!updatedDoctor) {
      return apiError(API_ERROR_CODES.NOT_FOUND, 'Doctor not found', 404);
    }

    return apiSuccess<DoctorProfile>(updatedDoctor);
  } catch (error) {
    return handleApiError(error, 'Failed to update doctor');
  }
}
