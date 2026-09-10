import { NextRequest } from 'next/server';
import {
  createSession,
  updateSession,
  getSessionsByDoctor,
  getSessionsByPatient,
  getSessionById,
  isDoctorVerified,
  Session,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { sessionCreateOrUpdateSchema } from '@/lib/validations';
import {
  apiError,
  apiSuccess,
  handleApiError,
  zodValidationError,
} from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = sessionCreateOrUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'doctorId and patientId are required'
      );
    }

    const { doctorId, patientId, transcript, soapNote, sessionId, id } =
      parseResult.data;

    if (auth.userType === 'doctor') {
      if (doctorId !== auth.sub) {
        return apiError(
          API_ERROR_CODES.FORBIDDEN,
          'Forbidden: Cannot manage sessions for another doctor',
          403
        );
      }

      const verified = await isDoctorVerified(doctorId);
      if (!verified) {
        return apiError(
          API_ERROR_CODES.ACCOUNT_UNVERIFIED,
          'Forbidden: Your medical license is pending review. Clinical sessions are locked until verified.',
          403
        );
      }
    }

    const targetId = sessionId || id;
    let session: Session | null = null;

    if (targetId) {
      const existing = await getSessionById(targetId);
      if (existing) {
        // Authorization: only the session's doctor or admin may update it
        if (auth.userType !== 'admin' && existing.doctorId !== auth.sub) {
          return apiError(
            API_ERROR_CODES.FORBIDDEN,
            "Forbidden: Cannot update another doctor's session",
            403
          );
        }
        session = await updateSession(targetId, {
          doctorId,
          patientId,
          transcript: transcript || existing.transcript,
          status: 'completed',
          endedAt: Date.now(),
          soapNote: (soapNote as any) || existing.soapNote,
        });
      }
    }

    if (!session) {
      session = await createSession({
        ...(targetId ? { id: targetId } : {}),
        doctorId,
        patientId,
        startedAt: Date.now(),
        endedAt: Date.now(),
        transcript,
        status: 'completed',
        soapNote: (soapNote as any) || undefined,
      });
    }

    return apiSuccess({ session });
  } catch (error) {
    return handleApiError(error, 'Failed to create session');
  }
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const doctorId = request.nextUrl.searchParams.get('doctorId');
    const patientId = request.nextUrl.searchParams.get('patientId');

    if (sessionId) {
      const session = await getSessionById(sessionId);
      if (!session) {
        return apiError(API_ERROR_CODES.NOT_FOUND, 'Session not found', 404);
      }
      // BOLA check: only the session's doctor or patient can view it
      if (
        auth.sub !== session.doctorId &&
        auth.sub !== session.patientId &&
        auth.userType !== 'admin'
      ) {
        return apiError(
          API_ERROR_CODES.FORBIDDEN,
          'Forbidden: Access denied to this session',
          403
        );
      }

      return apiSuccess({ session });
    }

    if (!doctorId && !patientId) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Either sessionId, doctorId, or patientId is required',
        400
      );
    }

    let sessions: Session[] = [];

    if (doctorId) {
      if (auth.userType === 'doctor' && doctorId !== auth.sub) {
        return apiError(
          API_ERROR_CODES.FORBIDDEN,
          'Forbidden: Cannot list sessions for another doctor',
          403
        );
      }
      sessions = await getSessionsByDoctor(doctorId);
    } else if (patientId) {
      if (auth.userType === 'patient' && patientId !== auth.sub) {
        return apiError(
          API_ERROR_CODES.FORBIDDEN,
          'Forbidden: Cannot list sessions for another patient',
          403
        );
      }
      sessions = await getSessionsByPatient(patientId);
    }

    return apiSuccess({ sessions });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch sessions');
  }
}
