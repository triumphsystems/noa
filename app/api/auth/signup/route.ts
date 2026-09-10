import { NextRequest, NextResponse } from 'next/server';
import {
  createDoctor,
  createPatient,
  updatePatient,
  migratePatientId,
  getDoctorByEmail,
  getPatientByEmail,
  type Patient,
} from '@/lib/db';
import { signUpWithCognito, getCognitoConfig } from '@/lib/auth/cognito';
import { enforceRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import { signupSchema } from '@/lib/validations';
import { apiError, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = signupSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'Registration validation failed');
    }

    const {
      email,
      password,
      firstName,
      lastName,
      userType,
      specialty,
      clinic,
      doctorId,
      license,
      issuingAuthority,
      licenseDocumentUrl,
    } = parseResult.data;

    // 1. Rate limiting: max 5 signups per minute per client
    const clientId = getClientIdentifier(request, email);
    const rateLimitRes = await enforceRateLimit(`signup:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (rateLimitRes) return rateLimitRes;

    const { isConfigured } = getCognitoConfig();

    // 1. AWS Cognito Registration
    let userSub = '';
    let isConfirmed = false;

    if (isConfigured) {
      const result = await signUpWithCognito({
        email,
        password,
        userType,
        firstName,
        lastName,
      });
      userSub = result.userSub;
      isConfirmed = result.isConfirmed;
    } else {
      return apiError(
        API_ERROR_CODES.SERVICE_UNAVAILABLE,
        'Registration service is currently unavailable.',
        503
      );
    }

    // 2. DynamoDB Medical Profile Record
    if (userType === 'doctor') {
      const existing = await getDoctorByEmail(email);
      if (existing) {
        return apiError(
          API_ERROR_CODES.CONFLICT,
          'An account with this email address already exists. Please sign in or reset your password.',
          409
        );
      }

      const doctor = await createDoctor({
        ...(userSub ? { id: userSub } : {}),
        email: email.trim().toLowerCase(),
        name: `${firstName} ${lastName}`.trim(),
        specialty: specialty || 'General Practice',
        clinic: clinic || 'Clinic',
        license: license ? license.trim() : 'LICENSE-PENDING',
        issuingAuthority: issuingAuthority?.trim(),
        licenseDocumentUrl: licenseDocumentUrl?.trim(),
        verificationStatus: 'pending',
      });

      return NextResponse.json({
        success: true,
        message: isConfirmed
          ? 'Doctor account created and submitted for clinical administration review.'
          : 'Doctor account created. Please verify your email with the confirmation code sent to you. Your medical credentials are pending administrator review.',
        userSub,
        isConfirmed,
        doctor: {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
          verificationStatus: doctor.verificationStatus,
        },
      });
    } else {
      const existing = await getPatientByEmail(email);
      let patient: Patient | null = null;

      if (existing) {
        // Check if existing record was a pre-created invitation (i.e. starts with patient- and no registered user)
        // or an already-registered patient account with a Cognito sub ID
        const isPreCreatedInvite =
          (existing.id.startsWith('patient-') ||
            existing.linkStatus === 'pending_patient_approval' ||
            existing.id !== userSub) &&
          (!existing.firstName ||
            existing.firstName === 'Pending' ||
            existing.linkStatus === 'pending_patient_approval' ||
            existing.linkStatus === 'linked');

        if (!isPreCreatedInvite && existing.id === userSub) {
          return NextResponse.json(
            {
              message:
                'An account with this email address already exists. Please sign in or reset your password.',
            },
            { status: 409 }
          );
        }

        // If it was a pre-created invitation from a clinician, migrate it to the canonical Cognito Auth ID
        if (existing.id !== userSub) {
          patient = await migratePatientId(existing.id, userSub);
        }
        patient = await updatePatient(userSub, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          ...(doctorId && !existing.doctorId ? { doctorId } : {}),
        });
      } else {
        patient = await createPatient({
          id: userSub,
          ...(doctorId ? { doctorId } : {}),
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }

      return NextResponse.json({
        success: true,
        message: isConfirmed
          ? 'Patient account created successfully'
          : 'Patient account created. Please verify your email with the confirmation code sent to you.',
        userSub,
        isConfirmed,
        patient: {
          id: patient?.id || userSub,
          email: patient?.email || email,
          firstName: patient?.firstName || firstName,
          lastName: patient?.lastName || lastName,
          ...(patient?.doctorId ? { doctorId: patient.doctorId } : {}),
        },
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    console.error('[Auth] Signup error:', msg);
    return apiError(API_ERROR_CODES.BAD_REQUEST, msg, 400);
  }
}
