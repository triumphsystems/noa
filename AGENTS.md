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
- **File Naming Convention:** As much as possible, keep file names to **one word** (e.g., `console.tsx`, `view.tsx`, `dossier.tsx`, `detail.tsx`, `shell.tsx`, `form.tsx`, `status.tsx`). Avoid multi-word hyphenated filenames unless absolutely necessary for clarity or domain disambiguation.
- **File Length & Modularity:** Keep files concise and focused (aim under ~200 lines). Break large files down into domain-specific modules. For Server Actions, avoid massive monolithic `actions.ts` files—split them logically by domain or route module (e.g., within route folders or dedicated single-word action modules).
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

## Authentication & Authorization Architecture (RSC & Server Actions)

> Single sources of truth: `lib/auth/roles.ts` (routing/RBAC), `lib/auth/server.ts` (RSC/Server Actions auth), `lib/auth/guard.ts` (API routes).

### 1. Role Contract & Routing (`lib/auth/roles.ts`)

- AWS Cognito RS256 token claim `custom:user_type` is the cryptographic source of truth.
- Roles are strictly `'doctor' | 'patient' | 'admin'` (`Role` type from `lib/auth/roles.ts`).
- Dashboard routes are deterministic: use `getDashboardPath(role)` (`/dashboard/<role>`). Never hardcode dashboard redirect paths inline.

### 2. Server-Side Auth in React Server Components & Server Actions (`lib/auth/server.ts`)

For RSC pages, layouts, and Server Actions, always use the canonical server helpers:

- `requireServerAuth(allowedRoles?, redirectTo?)`: Validates session from cookies/headers directly on the server; redirects automatically if invalid or unauthorized.
- `getServerAuth()`: Returns `{ isValid: true, sub, userType, ... }` or `{ isValid: false }`.
- `getServerProfile()`: Enriches the authenticated session with display info directly from DynamoDB.

```typescript
// RSC Page Example:
export default async function DoctorDashboardPage() {
  const auth = await requireServerAuth(['doctor']);
  const data = await getDoctorData(auth.sub);
  return <DoctorView initialData={data} />;
}
```

### 3. API Route Guard (`lib/auth/guard.ts`) & Standard Responses (`lib/api/response.ts`)

- All remaining REST/API routes must call `const guard = await requireAuth(request, allowedRoles)`.
- Use canonical API response helpers: `apiSuccess(data)`, `apiError(code, message, status)`, `handleApiError(error)`.
- Never leak raw stack traces, database details, or AWS SDK errors to clients.

### 4. Client-Side Authentication (`lib/auth-context.tsx` & `lib/http.ts`)

- `useAuth()` in `lib/auth-context.tsx` is the client gateway for browser login/logout.
- Client requests that need automatic 401 refresh token retry must use `http` from `lib/http.ts` instead of raw `fetch`.
- Local storage auth keys must be accessed solely through `lib/auth/storage.ts` (`clearAuthStorage()`, `setStoredUserId()`).

### 5. Strictness Rules

- **No `catch (error: any)`**: Always narrow with `error instanceof Error ? error.message : '...'`.
- **No double casts**: Avoid `as unknown as Type`.
- **No inline role unions**: Always import `type { Role }` from `@/lib/auth/roles`.
- **One-Word Component Files**: Keep file names to one word (e.g., `view.tsx`, `console.tsx`, `dossier.tsx`, `detail.tsx`, `shell.tsx`).
- **File Length**: Aim under ~200 lines per file; modularize server actions by route or domain instead of monolithic files.

---

## Notes for Agents

- Use `@/*` alias defined in `tsconfig.json`.
- Execute tests via `pnpm test` (uses Node's `--test` runner).
- Manage AWS infrastructure changes exclusively through `terraform/`.
