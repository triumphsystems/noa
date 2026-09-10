## Project Overview

Noa is an AI-Powered Medical Intelligence Platform that transforms medical consultations into structured clinical intelligence. It leverages AWS Bedrock (Nova & Sonic) for AI and voice processing, enabling automated SOAP note generation, clinical suggestions, and patient management.

## Core Technologies

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** Zustand
- **Real-time:** Socket.io
- **Infrastructure:** AWS (Bedrock, S3, DynamoDB, IAM, CloudWatch), Terraform
- **Deployment:** Vercel

## Development Workflow

### Setup

1.  **Prerequisites:**
    - Node.js 20+, pnpm 9+
    - AWS Account with Bedrock access (Nova Lite, Nova Pro, Sonic) and permissions for S3, DynamoDB, CloudWatch.
    - Vercel Account.
2.  **Dependencies:**
    ```bash
    git clone <repository_url> # Replace with actual repo URL if cloning
    cd noa
    pnpm install
    ```
3.  **Configuration:**
    - Copy `.env.example` to `.env.local` and populate with AWS and application settings.
    - For local DynamoDB or S3 testing, ensure correct configuration or use Terraform to provision AWS resources.

### Running the Application

- **Development Server:**
  ```bash
  pnpm dev
  ```
  The application hot-reloads on file changes.

### Code Quality & Formatting

- **Linting:** `pnpm lint` (uses ESLint)
- **Formatting:**
  - Apply formatting: `pnpm format` (uses Prettier)
  - Check formatting: `pnpm format:check`
- **TypeScript:** `tsconfig.json` is configured for Next.js and modern JS standards. The `compilerOptions.paths` alias `@/*` is used for imports (e.g., `import {...} from '@/lib/utils'`).

### Testing

- **Primary Test Command:**
  ```bash
  pnpm test
  ```
  This command executes tests in `tests/webmcp.test.mjs`, `tests/auth.test.mjs`, and `tests/ratelimit.test.mjs` using Node's built-in test runner.
- **Connectivity Checks:**
  ```bash
  pnpm test:db       # Check DynamoDB connectivity
  pnpm test:aws      # Validate AWS credentials
  curl http://localhost:3000/api/health # API health check
  ```

### Data Seeding

- **Initial Admin User:**
  ```bash
  pnpm seed:admin
  ```
  (This command executes `scripts/seed-admin.mjs`)

## Infrastructure Management

- **Tool:** Terraform
- **Directory:** `terraform/`
- **Commands:**
  ```bash
  cd terraform
  terraform init
  terraform plan
  terraform apply
  terraform output > outputs.txt # Save outputs for environment configuration
  ```
- **Resources Provisioned:** S3 buckets (audio, backup), IAM roles for Bedrock/AI, DynamoDB tables, CloudWatch log groups.

## Deployment

- **Platform:** Vercel
- **Production Workflow:**
  1.  Provision production infrastructure: `cd terraform && terraform apply -var="environment=production"
  2.  Push changes to the `main` branch (`git push origin main`) for automatic Vercel deployment.
  3.  Verify deployment: `vercel logs`, `curl https://<your-domain>.com/api/health`
- **Pre-deployment Checklist:** Refer to `README.md` or `docs/deployment.md` for a detailed checklist covering infrastructure, environment variables, security, and monitoring.

## Security & Compliance

- **Architecture:** Designed to be HIPAA-ready.
- **Measures:** TLS encryption in transit, S3/DynamoDB encryption at rest, IAM-based RBAC with OIDC authentication, input validation, API rate limiting.
- **Audit Logging:** Utilizes AWS CloudWatch.

## Key Files & Directories

- `.env.local`: Local environment configuration.
- `lib/auth/roles.ts`: **Canonical** role and routing utilities — single source of truth for `Role`, `getDashboardPath()`, `isValidRole()`.
- `lib/auth/guard.ts`: **Canonical** server-side auth guard — `requireAuth()` for all API routes.
- `lib/auth/jwt.ts`: JWT decode + RS256 verification (server only, never import on client).
- `lib/auth/cognito.ts`: AWS Cognito SDK calls (sign-in, sign-up, refresh, sign-out).
- `lib/auth/cookies.ts`: HIPAA-compliant httpOnly cookie read/write helpers.
- `lib/auth-context.tsx`: Client-side `AuthProvider` and `useAuth()` hook — the **only** place to call `/api/auth/*` from the browser.
- `lib/http.ts`: Resilient fetch client with automatic 401 token-refresh — use instead of raw `fetch` in stores and hooks.
- `scripts/seed-admin.mjs`: Script for creating an initial admin user.
- `terraform/`: Infrastructure as code definitions.
- `tests/`: Contains unit and integration tests.
- `docs/`: Detailed documentation.

---

## Authentication & Authorization Architecture

> **Read this section in full before touching any auth-related code.**
> Violations introduce security holes, TypeScript `any` escapes, and unmaintainable duplication.

### The Role Contract

AWS Cognito is the **cryptographic source of truth** for `userType`. The token's `custom:user_type` claim is set at sign-up, signed with RS256, and cannot be forged. This means:

1. **The dashboard path is deterministic.** A `userType` of `'doctor'` always maps to `/dashboard/doctor`. There is never a reason to write `if (userType === 'doctor') redirect('/dashboard/doctor')`.
2. **Role checks must use the canonical `Role` type** from `lib/auth/roles.ts`. Never inline the union `'doctor' | 'patient' | 'admin'` again.
3. **The Cognito group fallback** (`cognito:groups`) exists only for legacy admin users seeded via `scripts/seed-admin.mjs` who may not have `custom:user_type`. New code must not rely on group names for routing.

### Canonical Role & Routing Utility — `lib/auth/roles.ts`

This file is the **single source of truth** for the role ↔ route relationship. All code everywhere must import from here.

```typescript
// lib/auth/roles.ts

export const ROLES = ['doctor', 'patient', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** Cognito group names that map to 'admin' (legacy support only). */
export const ADMIN_COGNITO_GROUPS = ['Admins', 'Superadmins'] as const;

/** Cognito group names that map to 'doctor' (legacy support only). */
export const DOCTOR_COGNITO_GROUPS = ['Doctors'] as const;

/** Returns true if the value is a valid Role. Use this as a type guard. */
export function isValidRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

/**
 * Derives the canonical dashboard path from a role.
 * Dashboard paths follow the convention /dashboard/<role> — no exceptions.
 *
 * @returns The dashboard path for the role, or '/auth/login' if invalid.
 */
export function getDashboardPath(role: Role | null | undefined): string {
  if (!role || !isValidRole(role)) return '/auth/login';
  return `/dashboard/${role}`;
}

/**
 * Extracts the target role from a dashboard pathname segment.
 * e.g. '/dashboard/doctor/sessions' → 'doctor'
 */
export function getRoleFromPath(pathname: string): Role | null {
  const segment = pathname.split('/')[2];
  return isValidRole(segment) ? segment : null;
}
```

**Rules:**

- `getDashboardPath(role)` replaces **every** ternary/switch that maps a role to a URL.
- Never hardcode `/dashboard/doctor`, `/dashboard/patient`, or `/dashboard/admin` inline anywhere outside this file.

### Canonical Server-Side Auth Guard — `lib/auth/guard.ts`

All API route handlers must use `requireAuth()` instead of duplicating the 10-line auth boilerplate.

```typescript
// lib/auth/guard.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, type VerifiedAuthPayload } from './jwt';
import { isValidRole, type Role } from './roles';

export type AuthGuardResult =
  | {
      ok: true;
      auth: Required<Pick<VerifiedAuthPayload, 'sub' | 'userType'>> &
        VerifiedAuthPayload;
    }
  | { ok: false; response: NextResponse };

/**
 * Verifies authentication and optionally enforces role authorization.
 * Use at the top of every protected API route handler.
 *
 * @param request   The incoming NextRequest.
 * @param allowedRoles  If provided, the verified userType must be in this array.
 *
 * @example
 * const guard = await requireAuth(request, ['doctor', 'admin']);
 * if (!guard.ok) return guard.response;
 * const { auth } = guard; // auth.sub and auth.userType are guaranteed non-undefined
 */
export async function requireAuth(
  request: NextRequest,
  allowedRoles?: ReadonlyArray<Role>
): Promise<AuthGuardResult> {
  const auth = await getAuthenticatedUser(request);

  if (!auth.isValid || !auth.sub || !isValidRole(auth.userType)) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(auth.userType)) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    auth: auth as Required<Pick<VerifiedAuthPayload, 'sub' | 'userType'>> &
      VerifiedAuthPayload,
  };
}
```

**Rules:**

- Every protected route **must** call `requireAuth()`. Never copy-paste `getAuthenticatedUser()` + `if (!auth.isValid)` again.
- `requireAuth` returns `auth.sub` and `auth.userType` as **non-optional** strings when `ok: true`. No optional chaining needed after the guard.

### Canonical API Response & Error Standards — `lib/types/api.types.ts` & `lib/api/response.ts`

All API route responses must use the canonical response helpers (`apiSuccess`, `apiError`, `handleApiError`). Never construct manual raw error JSON responses in route handlers.

#### 1. Wire Format Contract

```typescript
// SUCCESS: 200/201
{
  "success": true,
  "data": { ... }
}

// ERROR: 4xx/5xx (nested under error, machine-readable code + human-friendly message)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Chief complaint and symptoms are required",
    "details": [{ "field": "symptoms", "issue": "Required" }] // optional
  }
}
```

#### 2. Canonical Server Helpers — `lib/api/response.ts`

- **`apiSuccess(data, status = 200)`**: Returns `{ success: true, data }`.
- **`apiError(code, message, status, options?)`**: Explicit constructor for validation or 4xx responses. Must use an `API_ERROR_CODES` constant from `lib/types/api.types.ts`.
- **`handleApiError(error, fallbackMessage)`**: Universal handler for `catch (error)` blocks.
  - Logs full error stack to server/CloudWatch.
  - Returns intentional `AppError` code/message.
  - Maps Bedrock/AI capacity limits to `CAPACITY_EXCEEDED` (429).
  - Redacts all unexpected errors into `INTERNAL_SERVER_ERROR` (500) — **never leak `error.message`, database schemas, or AWS SDK stack traces to the client**.

#### 3. Request Validation with Zod — `lib/validations/index.ts`

All API endpoints that accept request bodies must validate using canonical Zod schemas from `lib/validations`:
- Parse with `schema.safeParse(rawBody)`.
- If invalid, return `zodValidationError(parseResult.error, fallbackMessage)`.
- If a `ZodError` is thrown inside a handler, `handleApiError(error)` automatically converts it into a `400 VALIDATION_ERROR` with structured `{ field, issue }` details.

```typescript
// Route handler pattern:
const rawBody = await request.json().catch(() => ({}));
const parseResult = loginSchema.safeParse(rawBody);
if (!parseResult.success) {
  return zodValidationError(parseResult.error, 'Invalid credentials');
}
const { email, password } = parseResult.data;
```

#### 4. Client HTTP Layer — `lib/http.ts`

`http` throws a typed `ApiClientError` on non-2xx responses. Consume with `instanceof ApiClientError`:
```typescript
try {
  await http.post('/api/endpoint', payload);
} catch (err) {
  if (err instanceof ApiClientError) {
    console.error(err.code, err.status, err.details);
  }
}
```

### Canonical Session Storage Keys — `lib/auth/storage.ts`

All client-side localStorage reads and writes for auth identifiers must use this constant. Never hardcode key strings inline.

```typescript
// lib/auth/storage.ts

export const AUTH_STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_TYPE: 'userType',
  ACTIVE_INTAKE: 'active_intake_session',
  INTAKE_COMPLETION: 'intake-completion',
} as const;

export type AuthStorageKey =
  (typeof AUTH_STORAGE_KEYS)[keyof typeof AUTH_STORAGE_KEYS];

/** Clears all auth-related localStorage entries. */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) =>
    window.localStorage.removeItem(key)
  );
}

/** Writes the canonical user ID and userType into localStorage. */
export function setStoredUserId(role: Role, id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEYS.USER_ID, id);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, role);
}
```

**Rules:**

- `clearAuthStorage()` replaces the two divergent key arrays in `lib/http.ts` (`handleAuthExpiration`) and `lib/auth-context.tsx` (`logout`). Both must call the same function.
- `setStoredUserId(role, id)` replaces the `if (userType === 'doctor') setItem('doctorId', ...)` patterns in `login-form.tsx`, `signup-form.tsx`, and `auth-context.tsx`.

### Canonical Profile Resolution — `lib/auth/profile.ts`

The logic to resolve a display name and avatar from DynamoDB must exist **once**, called by `/api/auth/login`, `/api/auth/me`, and `/api/auth/refresh`.

```typescript
// lib/auth/profile.ts

import { getDoctorById, getPatientById, getAdminByEmail } from '@/lib/db';
import type { Role } from './roles';

export interface ResolvedUserProfile {
  id: string;
  email: string;
  name: string;
  userType: Role;
  avatar: string | null;
}

/**
 * Fetches the canonical display profile for an authenticated user from DynamoDB.
 * Returns null if the user does not exist in DynamoDB (never synthesizes phantom profiles).
 */
export async function resolveUserProfile(
  sub: string,
  userType: Role
): Promise<ResolvedUserProfile | null> {
  try {
    const user = await getUserById(sub, userType);
    if (!user) return null;

    const name =
      'name' in user && user.name
        ? user.name
        : 'firstName' in user && user.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : 'User';

    const avatar = 'avatar' in user ? user.avatar ?? null : null;

    return {
      id: user.id,
      email: user.email,
      name,
      userType,
      avatar,
    };
  } catch {
    // DB lookup failure logged
  }
  return null;
}
```

### Client-Side Auth Rules

#### `AuthContext` is the only auth gateway on the client

- Components **must** call `useAuth().login(email, password, userType)` — never call `fetch('/api/auth/login')` directly from a component or form.
- Components **must** call `useAuth().logout()` — never call `fetch('/api/auth/logout')` directly.
- `AuthContext.login()` must call `setStoredUserId(userType, user.id)` from `lib/auth/storage.ts` internally — not inline ternaries.

#### Never use raw `fetch` inside Zustand stores or dashboard hooks

- Zustand stores (`doctor.store.ts`, `patient.store.ts`) must use `http` from `lib/http.ts`.
- `http` transparently handles 401 → token refresh → retry via `performTokenRefresh()`.
- Raw `fetch` bypasses the refresh interceptor entirely — expired sessions will silently fail.

#### `AuthContext.verifySession()` must use the `http` client

The `fetch('/api/auth/me')` call in `AuthContext` must be `http.get('/api/auth/me')` so that expired sessions on app mount are silently refreshed rather than returning `{ user: null }`.

### Middleware Rules

The edge middleware (`middleware.ts`) follows a strict two-step pattern:

1. **Landing page (`/`):** Use `getAuthenticatedUserSync()` for the access token. If invalid, fall back to `noa_session` cookie (30-day `userType` hint) + `noa_refresh_token` presence. If both indicate a valid role, redirect to `getDashboardPath(role)` — the dashboard will silently refresh the token on load.
2. **Protected routes (`/dashboard/:role/*`):** Extract the target role from `pathname.split('/')[2]`. If `auth.userType !== targetRole`, redirect to `getDashboardPath(auth.userType)`. No `ROUTE_GUARDS` table is needed — the path segment is the guard.

```typescript
// middleware.ts — canonical pattern (do not deviate)
const targetRole = getRoleFromPath(pathname); // from lib/auth/roles.ts
if (targetRole) {
  const auth = getAuthenticatedUserSync(request);
  const hasRefreshToken = Boolean(
    request.cookies.get('noa_refresh_token')?.value
  );

  if (!auth.isValid) {
    if (hasRefreshToken) return NextResponse.next(); // client will refresh
    return NextResponse.redirect(
      new URL(`/auth/login?from=${pathname}`, request.url)
    );
  }

  if (auth.userType !== targetRole) {
    return NextResponse.redirect(
      new URL(getDashboardPath(auth.userType), request.url)
    );
  }
}
```

### TypeScript Strictness Rules

These patterns are **forbidden** in all auth-related code:

| Forbidden Pattern                                                       | Reason                                  | Replacement                                                                               |
| ----------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `catch (error: any)`                                                    | Disables type safety on error handling  | `catch (error) { const msg = error instanceof Error ? error.message : 'Unknown error'; }` |
| `as Record<string, unknown>` for API responses                          | Erases response types                   | Define a typed interface for every API response                                           |
| `as unknown as SomeType`                                                | Double-cast is a type safety bypass     | Fix the type at its declaration source                                                    |
| `let patient: any = null`                                               | Untyped variable                        | `let patient: Patient                                                                     | null = null` |
| `userData: Record<string, unknown>` on function signatures              | Erases caller type safety               | Define a typed input interface                                                            |
| Inline role union `'doctor' \| 'patient' \| 'admin'`                    | Duplicates the Role type                | Import `Role` from `lib/auth/roles.ts`                                                    |
| `if (userType === 'doctor') router.push('/dashboard/doctor')`           | Hardcoded routing logic                 | `router.push(getDashboardPath(userType))`                                                 |
| `['doctorId', 'patientId', ...]` inline in logout/expiry                | Divergent key lists cause storage leaks | Use `clearAuthStorage()` from `lib/auth/storage.ts`                                       |
| `fetch('/api/auth/...')` in stores or non-auth components               | Bypasses the 401 refresh interceptor    | Use `http` from `lib/http.ts` or `useAuth()` from auth-context                            |
| Checking `data.authenticated` from `/api/auth/me` response              | `/api/auth/me` never returns this field | Check `data.user !== null`                                                                |
| `['Admins', 'Superadmins', 'admins', 'superadmins'].includes(g)` inline | Duplicated across 4+ files              | Use `ADMIN_COGNITO_GROUPS` from `lib/auth/roles.ts`                                       |

### The Cognito → DynamoDB → Client Data Flow

```
Cognito token (RS256 signed)
  └─ custom:user_type = 'doctor' | 'patient' | 'admin'  ← AUTHORITATIVE, cannot be forged

  Server-side verification (lib/auth/jwt.ts)
    └─ getAuthenticatedUser(request) → VerifiedAuthPayload { isValid, sub, userType }

  Profile enrichment (lib/auth/profile.ts)
    └─ resolveUserProfile(sub, userType) → ResolvedUserProfile
         └─ getUserById(sub, userType) from DynamoDB

  Client hydration (lib/auth-context.tsx)
    └─ AuthProvider → UserSession { id, email, name, userType, avatar }
         └─ Zustand stores consume userType via localStorage hint only
              └─ localStorage keys managed exclusively by lib/auth/storage.ts
```

---

## Notes for Agents

- When searching for files, consider the `@/*` path alias defined in `tsconfig.json`.
- Be aware that tests are run using Node's built-in `--test` runner targeting specific files defined in `package.json`.
- Ensure AWS credentials and Bedrock access are correctly configured for development and testing environments.
- Terraform is critical for provisioning AWS resources. Always manage infrastructure changes through the `terraform/` directory.
- **Read the "Authentication & Authorization Architecture" section above before modifying any file in `lib/auth/`, `middleware.ts`, `lib/auth-context.tsx`, `lib/http.ts`, `app/api/auth/`, or any dashboard layout/page that handles identity.**
