import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  Mail,
  Phone,
  ShieldAlert,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DoctorItem } from './types';
import { getDoctorInitials } from './types';

interface AdminTableProps {
  loading: boolean;
  doctors: DoctorItem[];
  searchQuery: string;
  specialtyFilter: string;
  activeTab: 'pending' | 'verified' | 'rejected' | 'all';
  actionLoadingId: string | null;
  copiedCode: string | null;
  onCopy: (text: string, label: string) => void;
  onApproveClick: (doctor: DoctorItem) => void;
  onRejectClick: (doctor: DoctorItem) => void;
  onRevokeClick: (doctor: DoctorItem) => void;
  onDossierClick: (doctor: DoctorItem) => void;
  onResetFilters: () => void;
}

export function AdminTable({
  loading,
  doctors,
  searchQuery,
  specialtyFilter,
  activeTab,
  actionLoadingId,
  copiedCode,
  onCopy,
  onApproveClick,
  onRejectClick,
  onRevokeClick,
  onDossierClick,
  onResetFilters,
}: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      {loading ? (
        <div className="space-y-6 p-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex animate-pulse flex-col justify-between gap-4 md:flex-row"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-44 rounded bg-slate-200" />
                    <div className="h-3 w-28 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-4">
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 rounded-lg bg-slate-200" />
                <div className="h-8 w-20 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="space-y-3 p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-800">
            No clinicians found
          </h3>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">
            {searchQuery || specialtyFilter !== 'all'
              ? 'No practitioner profiles match your current search query or specialty filter.'
              : activeTab === 'pending'
                ? 'Great job! All submitted clinician registrations have been fully reviewed and verified.'
                : `There are currently no clinicians with the status "${activeTab}".`}
          </p>
          {(searchQuery ||
            specialtyFilter !== 'all' ||
            activeTab !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="mt-2 text-xs"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-deep-ink/5 divide-y">
          {doctors.map((doctor) => {
            const status = doctor.verificationStatus || 'pending';
            const isPending = status === 'pending';
            const isVerified = status === 'verified';
            const isRejected = status === 'rejected';

            return (
              <div
                key={doctor.id}
                className="hover:bg-soft-meadow/30 flex flex-col justify-between gap-4 p-4 transition-colors sm:gap-6 sm:p-6 lg:flex-row lg:items-center"
              >
                {/* Left Clinician Identity & Metadata */}
                <div className="min-w-0 flex-1 space-y-3.5">
                  <div className="flex items-start gap-3 sm:items-center sm:gap-3.5">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-serif text-sm font-bold shadow-2xs sm:h-11 sm:w-11',
                        isVerified &&
                          'border-emerald-200/80 bg-emerald-50 text-emerald-800',
                        isPending &&
                          'border-amber-200/80 bg-amber-50 text-amber-900',
                        isRejected &&
                          'border-rose-200/80 bg-rose-50 text-rose-900'
                      )}
                    >
                      {getDoctorInitials(doctor.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
                          Dr. {doctor.name.replace(/^dr\.?\s+/i, '')}
                        </h3>

                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs',
                            isVerified &&
                              'border-emerald-200/80 bg-emerald-50 text-emerald-800',
                            isPending &&
                              'border-amber-200/80 bg-amber-50 text-amber-900',
                            isRejected &&
                              'border-rose-200/80 bg-rose-50 text-rose-900'
                          )}
                        >
                          {isVerified && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                          )}
                          {isPending && (
                            <Clock className="h-3 w-3 text-amber-700" />
                          )}
                          {isRejected && (
                            <XCircle className="h-3 w-3 text-rose-700" />
                          )}
                          <span className="capitalize">{status}</span>
                        </span>

                        <button
                          onClick={() =>
                            onCopy(doctor.careCode, `code-${doctor.id}`)
                          }
                          className="bg-soft-meadow text-deep-ink border-deep-ink/10 hover:bg-soft-meadow/80 flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold transition-colors"
                          title="Click to copy care code"
                        >
                          <span>{doctor.careCode}</span>
                          {copiedCode === `code-${doctor.id}` ? (
                            <Check className="h-3 w-3 text-emerald-700" />
                          ) : (
                            <Copy className="text-slate h-3 w-3" />
                          )}
                        </button>
                      </div>

                      <div className="text-slate mt-1 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <Mail className="text-slate/70 h-3 w-3 shrink-0" />
                          <span className="text-deep-ink font-medium break-all">
                            {doctor.email}
                          </span>
                        </span>
                        {doctor.phone && (
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <Phone className="text-slate/70 h-3 w-3" />
                            <span>{doctor.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credential Data Grid */}
                  <div className="bg-soft-meadow/50 border-deep-ink/8 grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl border p-3 text-xs sm:grid-cols-2 sm:gap-x-6 sm:p-3.5 lg:grid-cols-3">
                    <div>
                      <span className="text-slate block text-[11px] font-medium">
                        Specialty
                      </span>
                      <span className="text-deep-ink font-semibold">
                        {doctor.specialty || 'General Practice'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate block text-[11px] font-medium">
                        Clinic Affiliation
                      </span>
                      <span
                        className="text-deep-ink block truncate font-semibold"
                        title={doctor.clinic}
                      >
                        {doctor.clinic || 'Independent Practice'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate block text-[11px] font-medium">
                        Medical License #
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-deep-ink border-deep-ink/10 rounded border bg-white px-1.5 py-0.5 font-mono text-xs font-bold break-all">
                          {doctor.license}
                        </span>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(
                            `medical license registry verification "${doctor.license}" "${doctor.name}"`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-deep-ink hover:text-slate inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium hover:underline"
                          title="Search state medical registry"
                        >
                          <span>Verify Board</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate block text-[11px] font-medium">
                        Issuing Authority
                      </span>
                      <span className="text-deep-ink/80 block truncate font-medium">
                        {doctor.issuingAuthority || 'State Medical Board'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate block text-[11px] font-medium">
                        Registered Date
                      </span>
                      <span className="text-deep-ink/80">
                        {new Date(doctor.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate block text-[11px] font-medium">
                        License Documentation
                      </span>
                      {doctor.licenseDocumentUrl ? (
                        <a
                          href={doctor.licenseDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-deep-ink hover:text-slate inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2"
                        >
                          <FileCheck className="text-deep-ink/70 h-3 w-3" />
                          <span>View Certificate</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate/60 italic">
                          Self-attested (no file)
                        </span>
                      )}
                    </div>
                  </div>

                  {doctor.rejectionReason && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/90 p-3 text-xs break-words text-rose-950">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-semibold text-rose-900">
                          Credential Revocation Reason:
                        </span>
                        <span className="leading-relaxed break-words">
                          {doctor.rejectionReason}
                        </span>
                      </div>
                    </div>
                  )}

                  {isVerified && doctor.verifiedAt && (
                    <div className="text-slate flex flex-wrap items-center gap-2 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      <span>
                        Verified on{' '}
                        {new Date(doctor.verifiedAt).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}{' '}
                        by {doctor.verifiedBy || 'Superadministrator'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-deep-ink/8 flex w-full flex-wrap items-center justify-stretch gap-2 border-t pt-3 sm:flex-nowrap sm:justify-end lg:w-auto lg:border-t-0 lg:pt-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDossierClick(doctor)}
                    className="text-deep-ink hover:text-deep-ink hover:bg-soft-meadow border-deep-ink/10 min-h-[38px] flex-1 justify-center gap-1 rounded-xl border text-xs sm:flex-initial"
                  >
                    <Eye className="text-slate h-3.5 w-3.5" />
                    <span>Dossier</span>
                  </Button>

                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onApproveClick(doctor)}
                        disabled={actionLoadingId === doctor.id}
                        className="bg-deep-ink hover:bg-deep-ink/90 min-h-[38px] flex-1 cursor-pointer justify-center gap-1.5 rounded-xl text-xs font-semibold text-white shadow-xs sm:flex-initial"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Approve</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRejectClick(doctor)}
                        disabled={actionLoadingId === doctor.id}
                        className="min-h-[38px] flex-1 cursor-pointer justify-center gap-1.5 rounded-xl border-rose-200/90 text-xs font-semibold text-rose-800 hover:border-rose-300 hover:bg-rose-50 sm:flex-initial"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}

                  {isRejected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApproveClick(doctor)}
                      disabled={actionLoadingId === doctor.id}
                      className="text-deep-ink border-deep-ink/20 hover:bg-soft-meadow min-h-[38px] flex-1 cursor-pointer justify-center gap-1.5 rounded-xl text-xs font-semibold sm:flex-initial"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Re-Verify</span>
                    </Button>
                  )}

                  {isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRevokeClick(doctor)}
                      disabled={actionLoadingId === doctor.id}
                      className="text-slate border-deep-ink/10 min-h-[38px] flex-1 cursor-pointer justify-center gap-1 rounded-xl text-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:flex-initial"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Revoke Access</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}