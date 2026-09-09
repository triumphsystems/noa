/**
 * Canonical Database Layer
 * Modularized into domain modules under lib/db/:
 * - client.ts: DynamoDBDocumentClient, batchGetItems, table constants
 * - types.ts: Type definitions for Doctor, Patient, Session, Intake, Admin
 * - doctors.ts: Doctor CRUD & verification
 * - patients.ts: Patient CRUD & linking
 * - sessions.ts: Session CRUD & notes
 * - intakes.ts: PatientIntake CRUD
 * - admins.ts: AdminUser CRUD
 */

export * from './db';

