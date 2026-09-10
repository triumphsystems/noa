'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  UserCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ExternalLink,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { DoctorItem, REJECTION_PRESETS, getDoctorInitials } from './types';

interface ApprovalDialogProps {
  doctor: DoctorItem | null;
  actionLoading: boolean;
  onConfirm: (doctor: DoctorItem) => void;
  onClose: () => void;
}

export function ApprovalDialog({
  doctor,
  actionLoading,
  onConfirm,
  onClose,
}: ApprovalDialogProps) {
  if (!doctor) return null;

  return (
    <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="shadow-editorial-elevated border-deep-ink/10 w-full max-w-lg space-y-4 rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-800">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-deep-ink font-serif text-base font-bold">
              Grant Clinical Practice Privileges
            </h3>
            <p className="text-slate text-xs">Dr. {doctor.name}</p>
          </div>
        </div>

        <div className="bg-soft-meadow/70 border-deep-ink/8 text-deep-ink space-y-1.5 rounded-xl border p-3.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate">Email:</span>
            <span className="font-medium">{doctor.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">License Number:</span>
            <span className="text-deep-ink font-mono font-bold">
              {doctor.license}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Specialty:</span>
            <span className="font-medium">{doctor.specialty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Clinic:</span>
            <span className="font-medium">{doctor.clinic}</span>
          </div>
        </div>

        <div className="text-slate space-y-1 text-xs leading-relaxed">
          <p>
            Approving this clinician will assign their Cognito account to the{' '}
            <strong>Doctors</strong> security group, enabling full access to
            patient health records, live clinical sessions, and prescription
            creation.
          </p>
          <p className="font-medium text-emerald-800">
            An audit entry will be permanently logged in DynamoDB with your
            Administrator ID.
          </p>
        </div>

        <div className="border-deep-ink/8 flex justify-end gap-2.5 border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={actionLoading}
            className="border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-soft-meadow rounded-xl"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(doctor)}
            disabled={actionLoading}
            className="bg-deep-ink hover:bg-deep-ink/90 cursor-pointer gap-1.5 rounded-xl font-semibold text-white"
          >
            {actionLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Confirm Verification</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface RejectionDialogProps {
  doctor: DoctorItem | null;
  isRevocation: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  actionLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function RejectionDialog({
  doctor,
  isRevocation,
  reason,
  onReasonChange,
  actionLoading,
  onConfirm,
  onClose,
}: RejectionDialogProps) {
  if (!doctor) return null;

  return (
    <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="shadow-editorial-elevated border-deep-ink/10 w-full max-w-lg space-y-4 rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50 text-rose-800">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-deep-ink font-serif text-base font-bold">
              {isRevocation
                ? 'Revoke Clinical Privileges'
                : 'Reject Clinician Application'}
            </h3>
            <p className="text-slate text-xs">
              Dr. {doctor.name} ({doctor.email})
            </p>
          </div>
        </div>

        <p className="text-slate text-xs leading-relaxed">
          Select or specify why this clinician cannot be certified. This notice
          will be recorded in the clinical governance audit trail and revoke
          active privileges.
        </p>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-slate text-[11px] font-semibold tracking-wider uppercase">
            Common Administrative Reasons:
          </span>
          <div className="space-y-1">
            {REJECTION_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onReasonChange(preset)}
                className={cn(
                  'block w-full cursor-pointer rounded-xl border p-2.5 text-left text-xs transition-all',
                  reason === preset
                    ? 'border-rose-300 bg-rose-50 font-medium text-rose-950'
                    : 'bg-soft-meadow/50 text-slate border-deep-ink/10 hover:bg-soft-meadow hover:text-deep-ink'
                )}
              >
                • {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason Textarea */}
        <div className="space-y-1">
          <label className="text-deep-ink text-xs font-semibold">
            Detailed Feedback / Notes:
          </label>
          <textarea
            rows={3}
            placeholder="Enter specific audit findings or state medical board reference..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="border-deep-ink/15 focus:ring-deep-ink/20 focus:border-deep-ink bg-canvas text-deep-ink w-full rounded-xl border p-3 text-xs focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="border-deep-ink/8 flex justify-end gap-2.5 border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={actionLoading}
            className="border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-soft-meadow rounded-xl"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={actionLoading}
            className="cursor-pointer gap-1.5 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700"
          >
            {actionLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>
                  {isRevocation ? 'Confirm Revocation' : 'Confirm Rejection'}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DossierDialogProps {
  doctor: DoctorItem | null;
  onClose: () => void;
  onApprove: (doctor: DoctorItem) => void;
  onRevoke: (doctor: DoctorItem) => void;
}

export function DossierDialog({
  doctor,
  onClose,
  onApprove,
  onRevoke,
}: DossierDialogProps) {
  if (!doctor) return null;

  return (
    <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="shadow-editorial-elevated border-deep-ink/10 max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-2xl border bg-white p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-soft-meadow text-deep-ink border-deep-ink/10 flex h-12 w-12 items-center justify-center rounded-xl border font-serif text-base font-bold">
              {getDoctorInitials(doctor.name)}
            </div>
            <div>
              <h2 className="text-deep-ink font-serif text-lg font-bold">
                Dr. {doctor.name}
              </h2>
              <p className="text-slate text-xs">
                Care Code: {doctor.careCode} • {doctor.clinic}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate hover:text-deep-ink hover:bg-soft-meadow cursor-pointer rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status overview */}
        <div className="bg-soft-meadow/60 border-deep-ink/8 flex items-center justify-between rounded-xl border p-3.5">
          <div className="flex items-center gap-2">
            <span className="text-slate text-xs font-semibold tracking-wider uppercase">
              Status:
            </span>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize',
                doctor.verificationStatus === 'verified' &&
                  'border-emerald-200/80 bg-emerald-50 text-emerald-800',
                doctor.verificationStatus === 'pending' &&
                  'border-amber-200/80 bg-amber-50 text-amber-900',
                doctor.verificationStatus === 'rejected' &&
                  'border-rose-200/80 bg-rose-50 text-rose-900'
              )}
            >
              {doctor.verificationStatus}
            </span>
          </div>
          <span className="text-slate text-xs">
            Registered: {new Date(doctor.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Dossier sections */}
        <div className="space-y-4 text-xs">
          <h4 className="text-deep-ink text-[11px] font-bold tracking-wider uppercase">
            Contact & Clinic Details
          </h4>
          <div className="bg-soft-meadow/40 border-deep-ink/8 grid grid-cols-2 gap-4 rounded-xl border p-4">
            <div>
              <span className="text-slate block font-medium">Full Legal Name</span>
              <span className="text-deep-ink font-semibold">{doctor.name}</span>
            </div>
            <div>
              <span className="text-slate block font-medium">Primary Email</span>
              <span className="text-deep-ink font-semibold">{doctor.email}</span>
            </div>
            <div>
              <span className="text-slate block font-medium">
                Specialty Practice
              </span>
              <span className="text-deep-ink font-semibold">
                {doctor.specialty}
              </span>
            </div>
            <div>
              <span className="text-slate block font-medium">
                Affiliated Health Clinic
              </span>
              <span className="text-deep-ink font-semibold">
                {doctor.clinic}
              </span>
            </div>
          </div>

          <h4 className="text-deep-ink text-[11px] font-bold tracking-wider uppercase">
            Licensure Credentials
          </h4>
          <div className="bg-soft-meadow/40 border-deep-ink/8 grid grid-cols-2 gap-4 rounded-xl border p-4">
            <div>
              <span className="text-slate block font-medium">
                License / NPI Number
              </span>
              <span className="text-deep-ink font-mono text-sm font-bold">
                {doctor.license}
              </span>
            </div>
            <div>
              <span className="text-slate block font-medium">
                Issuing Board Authority
              </span>
              <span className="text-deep-ink font-semibold">
                {doctor.issuingAuthority || 'State Board'}
              </span>
            </div>
            <div>
              <span className="text-slate block font-medium">
                Official Registry Lookup
              </span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `medical board license verification "${doctor.license}" "${doctor.name}"`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="text-deep-ink inline-flex items-center gap-1 font-semibold hover:underline"
              >
                <span>Check State Registry</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <span className="text-slate block font-medium">
                Certificate Document
              </span>
              {doctor.licenseDocumentUrl ? (
                <a
                  href={doctor.licenseDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-deep-ink inline-flex items-center gap-1 font-semibold hover:underline"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Download Credential File</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-slate/60 italic">No document uploaded</span>
              )}
            </div>
          </div>

          {/* Audit history */}
          {doctor.verifiedAt && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-emerald-950">
              <span className="block font-bold text-emerald-900">
                Verified Record:
              </span>
              <span>
                Certified on {new Date(doctor.verifiedAt).toLocaleString()} by{' '}
                {doctor.verifiedBy || 'Administrator'}.
              </span>
            </div>
          )}

          {doctor.rejectionReason && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-4 text-rose-950">
              <span className="block font-bold text-rose-900">
                Rejection / Revocation Record:
              </span>
              <span className="mt-1 block leading-relaxed">
                {doctor.rejectionReason}
              </span>
            </div>
          )}
        </div>

        {/* Actions in dossier */}
        <div className="border-deep-ink/8 flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-soft-meadow rounded-xl"
          >
            Close Dossier
          </Button>

          <div className="flex gap-2">
            {doctor.verificationStatus !== 'verified' && (
              <Button
                size="sm"
                onClick={() => onApprove(doctor)}
                className="bg-deep-ink hover:bg-deep-ink/90 cursor-pointer gap-1.5 rounded-xl text-xs font-semibold text-white shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Approve Clinician</span>
              </Button>
            )}

            {doctor.verificationStatus === 'verified' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRevoke(doctor)}
                className="cursor-pointer gap-1.5 rounded-xl border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-50"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Revoke Privileges</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
