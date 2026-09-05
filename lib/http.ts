/**
 * Resilient HTTP Client for Noa
 * Transparently refreshes expired access tokens upon receiving 401 Unauthorized.
 * If refresh token is missing or expired, clears all client-side auth credentials,
 * resets application stores, and redirects to the appropriate login route.
 */

import { useDoctorStore } from '@/lib/stores/doctor.store';
import { usePatientStore } from '@/lib/stores/patient.store';
import { useSessionStore } from '@/lib/stores/session.store';

let refreshPromise: Promise<boolean> | null = null;

/**
 * Handle authentication expiration cleanup & navigation
 */
export function handleAuthExpiration() {
  if (typeof window === 'undefined') return;

  // 1. Identify user role before clearing for accurate redirect
  const storedUserType = window.localStorage.getItem('userType') || '';

  // 2. Clear all local storage authentication items
  const keysToRemove = [
    'doctorId',
    'patientId',
    'userType',
    'accessToken',
    'idToken',
    'refreshToken',
  ];
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));

  // 3. Clear Zustand application stores
  try {
    useDoctorStore.getState().clearDashboard();
    usePatientStore.getState().clearDashboard();
    useSessionStore.getState().resetSession();
  } catch (err) {
    console.error('[HTTP] Error clearing stores on session expiry:', err);
  }

  // 4. Redirect to login with expired notice
  const currentPath = window.location.pathname;
  const loginUrl = `/auth/login?expired=1&type=${storedUserType}${
    currentPath && !currentPath.startsWith('/auth')
      ? `&from=${encodeURIComponent(currentPath)}`
      : ''
  }`;

  window.location.href = loginUrl;
}

/**
 * De-duplicated token refresh request
 */
async function performTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Boolean(data.success);
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Enhanced fetch with automatic 401 interception and token refresh
 */
export async function http<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  // 1. Attempt original request
  let response = await fetch(input, {
    cache: 'no-store',
    ...init,
  });

  // 2. If 401 Unauthorized encountered, attempt single token refresh
  if (response.status === 401) {
    const isRefreshEndpoint =
      typeof input === 'string' && input.includes('/api/auth/refresh');

    if (!isRefreshEndpoint) {
      const refreshed = await performTokenRefresh();

      if (refreshed) {
        // Retry the original request with new cookies
        response = await fetch(input, {
          cache: 'no-store',
          ...init,
        });
      } else {
        // Refresh failed: session is irrecoverable
        handleAuthExpiration();
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      handleAuthExpiration();
      throw new Error('Session expired. Please log in again.');
    }
  }

  // 3. Parse JSON response
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  // If payload is wrapped in { data: ... }, return unwrapped or full data
  return (data.data !== undefined ? data.data : data) as T;
}

// Convenience REST methods
http.get = <T = any>(url: string, init?: Omit<RequestInit, 'method'>) =>
  http<T>(url, { ...init, method: 'GET' });

http.post = <T = any>(
  url: string,
  body?: any,
  init?: Omit<RequestInit, 'method' | 'body'>
) =>
  http<T>(url, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

http.put = <T = any>(
  url: string,
  body?: any,
  init?: Omit<RequestInit, 'method' | 'body'>
) =>
  http<T>(url, {
    ...init,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

http.delete = <T = any>(url: string, init?: Omit<RequestInit, 'method'>) =>
  http<T>(url, { ...init, method: 'DELETE' });
