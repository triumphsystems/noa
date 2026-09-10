'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies';
import {
  forgotPasswordWithCognito,
  confirmForgotPasswordWithCognito,
  revokeAllUserSessions,
  getCognitoConfig,
} from '@/lib/auth/cognito';

export interface AuthActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to log the user out on the server by clearing auth cookies.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const clearOptions = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };

  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, '', clearOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.ID_TOKEN, '', clearOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, '', clearOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.SESSION_META, '', clearOptions);

  redirect('/auth/login');
}

/**
 * Server Action to request a password reset code.
 */
export async function forgotPasswordAction(
  email: string
): Promise<AuthActionResult<{ destination?: string }>> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Email address is required' };
    }

    const { isConfigured } = getCognitoConfig();
    if (!isConfigured) {
      return { success: false, error: 'Auth service is not configured' };
    }

    try {
      const result = await forgotPasswordWithCognito(trimmedEmail);
      return { success: true, data: { destination: result.destination } };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send reset code';
      const errObj = err as Record<string, unknown> | undefined;

      // Prevent user enumeration
      if (
        errMsg.includes('No account found') ||
        errObj?.name === 'UserNotFoundException'
      ) {
        return { success: true, data: { destination: trimmedEmail } };
      }

      return { success: false, error: errMsg };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action to confirm password reset with verification code and new password.
 */
export async function resetPasswordAction(
  email: string,
  code: string,
  newPassword: string
): Promise<AuthActionResult<void>> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail || !trimmedCode || !newPassword) {
      return { success: false, error: 'Email, code, and new password are required' };
    }

    const { isConfigured } = getCognitoConfig();
    if (!isConfigured) {
      return { success: false, error: 'Auth service is not configured' };
    }

    await confirmForgotPasswordWithCognito({
      email: trimmedEmail,
      code: trimmedCode,
      newPassword,
    });

    // Revoke all existing sessions across devices
    await revokeAllUserSessions(trimmedEmail);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    };
  }
}
