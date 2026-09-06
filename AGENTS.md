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
- `scripts/seed-admin.mjs`: Script for creating an initial admin user.
- `terraform/`: Infrastructure as code definitions.
- `tests/`: Contains unit and integration tests.
- `docs/`: Detailed documentation.

## Notes for Agents

- When searching for files, consider the `@/*` path alias defined in `tsconfig.json`.
- Be aware that tests are run using Node's built-in `--test` runner targeting specific files defined in `package.json`.
- Ensure AWS credentials and Bedrock access are correctly configured for development and testing environments.
- Terraform is critical for provisioning AWS resources. Always manage infrastructure changes through the `terraform/` directory.
