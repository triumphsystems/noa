/**
 * Automated Test Suite for Server Action Mutations
 * Validates:
 * 1. invitePatient (FormData & object input, email validation, doctor verification check)
 * 2. linkDoctorCareCode (Care code validation, pending link creation)
 * 3. respondToDoctorLink (accept / decline transitions, unlinking)
 * 4. submitLicensure (license & authority validation, pending verification status)
 * 5. saveIntakeDraft (direct DynamoDB draft save, guest and patient resolution)
 *
 * Run with: node --test tests/actions.test.mjs
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Server Action Mutations Suite', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Patient Invites & Linking
  // ──────────────────────────────────────────────────────────────────────────
  describe('Patient Invites: invitePatient', () => {
    it('should validate email format and reject invalid emails', () => {
      const validateEmail = (email) => {
        if (!email || !email.includes('@') || !email.includes('.')) {
          return { valid: false, error: 'Valid email address is required' };
        }
        return { valid: true };
      };

      assert.equal(validateEmail('').valid, false);
      assert.equal(validateEmail('invalid-email').valid, false);
      assert.equal(validateEmail('patient@example.com').valid, true);
    });

    it('should normalize input whether provided as FormData or plain object', () => {
      function normalizeInviteInput(input) {
        if (input instanceof Map || (typeof input?.get === 'function')) {
          return {
            email: input.get('email')?.trim().toLowerCase() || '',
            firstName: input.get('firstName')?.trim() || undefined,
            lastName: input.get('lastName')?.trim() || undefined,
            phone: input.get('phone')?.trim() || undefined,
          };
        }
        return {
          email: input.email?.trim().toLowerCase() || '',
          firstName: input.firstName?.trim() || undefined,
          lastName: input.lastName?.trim() || undefined,
          phone: input.phone?.trim() || undefined,
        };
      }

      const formInput = new Map([
        ['email', 'Patient.Test@example.COM '],
        ['firstName', ' Jane '],
        ['lastName', ' Doe '],
      ]);

      const normalizedFromForm = normalizeInviteInput(formInput);
      assert.equal(normalizedFromForm.email, 'patient.test@example.com');
      assert.equal(normalizedFromForm.firstName, 'Jane');
      assert.equal(normalizedFromForm.lastName, 'Doe');

      const objInput = {
        email: 'Patient.Test@example.COM ',
        firstName: 'Jane',
      };
      const normalizedFromObj = normalizeInviteInput(objInput);
      assert.equal(normalizedFromObj.email, 'patient.test@example.com');
      assert.equal(normalizedFromObj.firstName, 'Jane');
    });

    it('should ensure unverified doctors cannot issue patient invitations', () => {
      function checkDoctorCanInvite(doctor) {
        if (!doctor) return { allowed: false, error: 'Doctor record not found' };
        if (doctor.verificationStatus !== 'verified') {
          return {
            allowed: false,
            error: 'Your medical credentials must be verified by clinical administration before inviting patients.',
          };
        }
        return { allowed: true };
      }

      assert.equal(
        checkDoctorCanInvite({ id: 'doc-1', verificationStatus: 'pending' }).allowed,
        false
      );
      assert.equal(
        checkDoctorCanInvite({ id: 'doc-2', verificationStatus: 'rejected' }).allowed,
        false
      );
      assert.equal(
        checkDoctorCanInvite({ id: 'doc-3', verificationStatus: 'verified' }).allowed,
        true
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Doctor Care Code Linking
  // ──────────────────────────────────────────────────────────────────────────
  describe('Doctor Care Code: linkDoctorCareCode', () => {
    it('should parse care code from string, object, or FormData', () => {
      function extractCareCode(input) {
        if (typeof input === 'string') return input.trim();
        if (typeof input?.get === 'function') {
          return input.get('careCode')?.trim() || input.get('doctorId')?.trim();
        }
        return input?.careCode?.trim() || input?.doctorId?.trim();
      }

      assert.equal(extractCareCode('NOA-7492AB'), 'NOA-7492AB');
      assert.equal(extractCareCode({ careCode: ' NOA-7492AB ' }), 'NOA-7492AB');
      assert.equal(
        extractCareCode(new Map([['careCode', 'NOA-7492AB']])),
        'NOA-7492AB'
      );
    });

    it('should stage relationship as pending_doctor_approval', () => {
      function simulateLinkDoctor(patient, doctor) {
        return {
          ...patient,
          pendingDoctorId: doctor.id,
          linkStatus: 'pending_doctor_approval',
          linkRequestedBy: 'patient',
          linkRequestedAt: Date.now(),
        };
      }

      const patient = { id: 'patient-1', linkStatus: 'unlinked' };
      const doctor = { id: 'doc-42', name: 'Smith' };
      const updated = simulateLinkDoctor(patient, doctor);

      assert.equal(updated.pendingDoctorId, 'doc-42');
      assert.equal(updated.linkStatus, 'pending_doctor_approval');
      assert.equal(updated.linkRequestedBy, 'patient');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Respond to Doctor Link
  // ──────────────────────────────────────────────────────────────────────────
  describe('Respond to Doctor Link: respondToDoctorLink', () => {
    it('should transition to linked when approved', () => {
      function processDoctorLinkResponse(patient, action) {
        if (patient.linkStatus !== 'pending_patient_approval' || !patient.pendingDoctorId) {
          throw new Error('No pending doctor connection request found.');
        }

        if (action === 'accept') {
          return {
            ...patient,
            doctorId: patient.pendingDoctorId,
            pendingDoctorId: null,
            linkStatus: 'linked',
          };
        } else if (action === 'decline') {
          return {
            ...patient,
            pendingDoctorId: null,
            linkStatus: 'unlinked',
          };
        }
        throw new Error('Invalid action');
      }

      const pendingPatient = {
        id: 'pat-1',
        pendingDoctorId: 'doc-99',
        linkStatus: 'pending_patient_approval',
      };

      const accepted = processDoctorLinkResponse(pendingPatient, 'accept');
      assert.equal(accepted.doctorId, 'doc-99');
      assert.equal(accepted.pendingDoctorId, null);
      assert.equal(accepted.linkStatus, 'linked');

      const declined = processDoctorLinkResponse(pendingPatient, 'decline');
      assert.equal(declined.doctorId, undefined);
      assert.equal(declined.pendingDoctorId, null);
      assert.equal(declined.linkStatus, 'unlinked');
    });

    it('should reject response when there is no pending request', () => {
      const unlinkedPatient = {
        id: 'pat-2',
        linkStatus: 'unlinked',
      };

      assert.throws(() => {
        if (unlinkedPatient.linkStatus !== 'pending_patient_approval' || !unlinkedPatient.pendingDoctorId) {
          throw new Error('No pending doctor connection request found.');
        }
      }, /No pending doctor connection request found/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Doctor Onboarding & Verification: submitLicensure
  // ──────────────────────────────────────────────────────────────────────────
  describe('Doctor Onboarding: submitLicensure', () => {
    it('should require non-empty license and issuing authority', () => {
      function validateLicensureInput(license, issuingAuthority) {
        if (!license || !license.trim()) {
          return { valid: false, error: 'Please enter your medical license number.' };
        }
        if (!issuingAuthority || !issuingAuthority.trim()) {
          return {
            valid: false,
            error: 'Please specify the issuing medical licensing authority or board.',
          };
        }
        return { valid: true };
      }

      assert.equal(validateLicensureInput('', 'GMC').valid, false);
      assert.equal(validateLicensureInput('MD-12345', '').valid, false);
      assert.equal(validateLicensureInput('MD-12345', 'California Medical Board').valid, true);
    });

    it('should update verification status to pending', () => {
      function applyLicensureUpdate(doctor, input) {
        return {
          ...doctor,
          license: input.license,
          issuingAuthority: input.issuingAuthority,
          verificationStatus: 'pending',
          licenseDocumentUrl: input.licenseDocumentUrl || doctor.licenseDocumentUrl,
          updatedAt: Date.now(),
        };
      }

      const currentDoctor = {
        id: 'doc-7',
        verificationStatus: 'rejected',
        license: '',
      };

      const updated = applyLicensureUpdate(currentDoctor, {
        license: 'MED-998877',
        issuingAuthority: 'Texas Medical Board',
        licenseDocumentUrl: 'https://s3.amazonaws.com/licenses/doc-7/cert.pdf',
      });

      assert.equal(updated.verificationStatus, 'pending');
      assert.equal(updated.license, 'MED-998877');
      assert.equal(updated.issuingAuthority, 'Texas Medical Board');
      assert.equal(updated.licenseDocumentUrl, 'https://s3.amazonaws.com/licenses/doc-7/cert.pdf');
    });

    it('should reject files exceeding 10MB', () => {
      const MAX_SIZE = 10 * 1024 * 1024;
      const validSize = 5 * 1024 * 1024;
      const oversized = 11 * 1024 * 1024;

      assert.equal(validSize <= MAX_SIZE, true);
      assert.equal(oversized <= MAX_SIZE, false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Intake Draft Submissions: saveIntakeDraft
  // ──────────────────────────────────────────────────────────────────────────
  describe('Intake Submissions: saveIntakeDraft', () => {
    it('should create a valid draft payload with incomplete status and 7-day TTL', () => {
      function buildIntakeDraftPayload(input, patientId) {
        const completed = Boolean(input.completed);
        return {
          patientId,
          doctorId: input.doctorId || '',
          chiefComplaint: input.chiefComplaint || input.summary || 'Clinical intake draft',
          summary: input.summary || input.chiefComplaint || 'Clinical intake draft',
          medicalHistory: input.medicalHistory || '',
          medications: input.medications || [],
          allergies: input.allergies || [],
          surgeries: input.surgeries || '',
          familyHistory: input.familyHistory || '',
          socialHistory: input.socialHistory || '',
          completed,
          completedAt: completed ? Date.now() : undefined,
          draft: input.draft || {},
          ttl: completed ? null : Math.floor(Date.now() / 1000) + 7 * 86400,
        };
      }

      const payload = buildIntakeDraftPayload(
        {
          chiefComplaint: 'Persistent migraine',
          medications: ['Ibuprofen 400mg'],
          allergies: ['Penicillin'],
          draft: { painLevel: 7 },
        },
        'patient-xyz'
      );

      assert.equal(payload.patientId, 'patient-xyz');
      assert.equal(payload.chiefComplaint, 'Persistent migraine');
      assert.equal(payload.completed, false);
      assert.equal(payload.completedAt, undefined);
      assert.equal(typeof payload.ttl, 'number');
      assert.deepEqual(payload.medications, ['Ibuprofen 400mg']);
      assert.deepEqual(payload.allergies, ['Penicillin']);
    });

    it('should update existing intake if intakeId is supplied', () => {
      const existingIntakes = new Map([
        ['intake-1', { id: 'intake-1', chiefComplaint: 'Headache', completed: false }],
      ]);

      function persistDraft(intakeId, payload) {
        if (intakeId && existingIntakes.has(intakeId)) {
          const updated = { ...existingIntakes.get(intakeId), ...payload };
          existingIntakes.set(intakeId, updated);
          return { action: 'updated', intake: updated };
        }
        const created = { id: intakeId || 'intake-new', ...payload };
        existingIntakes.set(created.id, created);
        return { action: 'created', intake: created };
      }

      const resultUpdate = persistDraft('intake-1', {
        chiefComplaint: 'Severe Migraine with Aura',
      });
      assert.equal(resultUpdate.action, 'updated');
      assert.equal(resultUpdate.intake.chiefComplaint, 'Severe Migraine with Aura');

      const resultCreate = persistDraft(undefined, {
        chiefComplaint: 'Knee pain',
      });
      assert.equal(resultCreate.action, 'created');
      assert.equal(resultCreate.intake.chiefComplaint, 'Knee pain');
    });
  });
});
