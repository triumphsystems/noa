'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Mail,
  Mic,
  Check,
  Copy,
  ShieldCheck,
  HeartPulse,
  Pill,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { DoctorPatientDetailData } from '@/lib/data/doctor';

interface PatientDetailViewProps {
  initialData: DoctorPatientDetailData;
}

export function PatientDetailView({ initialData }: PatientDetailViewProps) {
  const { patient, doctor, intake, sessions } = initialData;
  const [copiedId, setCopiedId] = React.useState(false);

  const handleCopyId = () => {
    if (!navigator.clipboard || !patient?.id) return;
    navigator.clipboard.writeText(patient.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const nameParts = [patient.firstName, patient.lastName].filter(
    (val) =>
      Boolean(val) &&
      typeof val === 'string' &&
      val.trim() !== '' &&
      val.trim().toLowerCase() !== 'undefined'
  );
  const fullName =
    nameParts.length > 0
      ? nameParts.join(' ').trim()
      : (patient.email ? patient.email.split('@')[0] : '') ||
        `Patient #${patient.id.slice(0, 8)}`;

  const initials =
    nameParts.length > 0
      ? nameParts
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

  const medicalHistory = patient.conditions?.length
    ? patient.conditions
    : intake?.medicalHistory
      ? [intake.medicalHistory]
      : [];
  const allergies = patient.allergies?.length
    ? patient.allergies
    : intake?.allergies || [];
  const currentMedications = patient.medications?.length
    ? patient.medications
    : intake?.medications || [];

  let ageDisplay = '—';
  if (patient.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    if (!isNaN(birthYear)) {
      const calculated = new Date().getFullYear() - birthYear;
      if (calculated > 0 && calculated < 130) {
        ageDisplay = `${calculated} yrs`;
      }
    }
  }

  const isLinked = patient.linkStatus === 'linked';
  const isPendingConsent = patient.linkStatus === 'pending_patient_approval';
  const displayStatus = isLinked
    ? 'Active & Linked'
    : isPendingConsent
      ? 'Consent Pending'
      : patient.linkStatus
        ? patient.linkStatus.replace(/_/g, ' ')
        : 'Consent Pending';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 font-sans sm:p-6 lg:p-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/doctor/patients"
          className="text-slate hover:text-deep-ink group flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Patients Registry</span>
          <span className="text-slate/40">/</span>
          <span className="text-deep-ink max-w-[200px] truncate sm:max-w-none">
            {fullName}
          </span>
        </Link>
      </div>

      {/* Patient Profile Hero Banner */}
      <Card className="border-deep-ink/10 space-y-5 border bg-white p-5 shadow-2xs sm:p-7">
        <div className="border-deep-ink/8 flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            {patient.avatar ? (
              <img
                src={patient.avatar}
                alt={fullName}
                className="h-14 w-14 shrink-0 rounded-2xl border border-teal-200/80 object-cover shadow-2xs"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-200/80 bg-teal-100 font-serif text-xl font-bold text-teal-800 shadow-2xs">
                {initials}
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-deep-ink font-serif text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                  {fullName}
                </h1>
                <Badge
                  variant={isLinked ? 'success' : 'secondary'}
                  className={
                    isLinked
                      ? 'text-xs'
                      : 'border-amber-200 bg-amber-50 text-xs font-semibold text-amber-900'
                  }
                >
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      isLinked ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
                    }`}
                  />
                  {displayStatus}
                </Badge>
              </div>

              {/* ID with Quick Copy */}
              <div className="text-slate flex items-center gap-2 text-xs">
                <span className="bg-soft-meadow/70 border-deep-ink/8 rounded border px-2 py-0.5 font-mono">
                  ID: {patient.id}
                </span>
                <button
                  onClick={handleCopyId}
                  title="Copy Patient ID"
                  aria-label="Copy Patient ID"
                  className="hover:text-deep-ink cursor-pointer p-0.5 transition-colors"
                >
                  {copiedId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="text-slate/80 h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex shrink-0 items-center gap-3">
            {isLinked ? (
              <Link
                href={`/dashboard/doctor/sessions/new?patientId=${patient.id}`}
                className="w-full sm:w-auto"
              >
                <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full cursor-pointer gap-2 rounded-full px-5 text-xs font-medium shadow-2xs sm:w-auto sm:text-sm">
                  <Mic className="h-4 w-4" />
                  <span>Start Voice Session</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  if (patient.email) {
                    window.open(
                      `mailto:${patient.email}?subject=Invitation%20from%20Dr.%20${doctor?.name || 'Clinic'}`
                    );
                  } else {
                    alert('No email recorded for this patient');
                  }
                }}
                className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full cursor-pointer gap-2 rounded-full text-xs font-medium sm:w-auto sm:text-sm"
              >
                <Mail className="text-slate h-3.5 w-3.5" />
                <span>Contact Patient</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Demographic Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 pt-1 text-xs sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-2.5">
            <span className="text-slate mb-0.5 block text-[11px]">Age</span>
            <span className="text-deep-ink text-sm font-semibold">
              {ageDisplay}
            </span>
          </div>
          <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-2.5">
            <span className="text-slate mb-0.5 block text-[11px]">Gender</span>
            <span className="text-deep-ink text-sm font-semibold capitalize">
              {patient.gender || '—'}
            </span>
          </div>
          <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-2.5">
            <span className="text-slate mb-0.5 block text-[11px]">
              Date of Birth
            </span>
            <span className="text-deep-ink text-sm font-semibold">
              {patient.dateOfBirth || '—'}
            </span>
          </div>
          <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-2.5">
            <span className="text-slate mb-0.5 block text-[11px]">Status</span>
            <span className="text-deep-ink text-sm font-semibold capitalize">
              {displayStatus}
            </span>
          </div>
          <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-2.5 sm:col-span-2 lg:col-span-2">
            <span className="text-slate mb-0.5 block text-[11px]">
              Contact Email
            </span>
            <span
              className="text-deep-ink block truncate text-sm font-semibold"
              title={patient.email}
            >
              {patient.email || '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* Consent Pending Banner */}
      {!isLinked && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-2xs sm:flex-row sm:items-center sm:text-sm">
          <div className="flex items-start gap-3 sm:items-center">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 sm:mt-0" />
            <p className="leading-relaxed">
              <span className="font-semibold">
                Connection Pending Patient Approval:{' '}
              </span>
              This patient has not yet connected with your clinic on their
              health portal. Clinical records, past summaries, and AI voice
              intakes will synchronize once approved.
            </p>
          </div>
          {patient.email && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                alert(
                  `Invitation reminder email triggered for ${patient.email}`
                )
              }
              className="h-8 shrink-0 rounded-xl border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Send Reminder
            </Button>
          )}
        </div>
      )}

      {/* Desktop 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Main Column (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Clinical Intake Record (Visible when doctor has consent/link) */}
          {isLinked && (
            <Card className="border-deep-ink/10 space-y-4 border bg-white p-5 shadow-2xs sm:p-6">
              <div className="border-deep-ink/6 flex flex-wrap items-center justify-between gap-3 border-b pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="bg-hi-yellow/40 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300 shadow-2xs">
                    <Sparkles className="h-4 w-4 text-amber-900" />
                  </div>
                  <div>
                    <h3 className="text-deep-ink font-serif text-sm font-bold sm:text-base">
                      AI Clinical Intake Record
                    </h3>
                    <p className="text-slate text-[11px]">
                      Synthesized patient intake consultation
                    </p>
                  </div>
                </div>
                {intake ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    <span>Intake Completed</span>
                    {intake.completedAt && (
                      <span className="text-emerald-700/80">
                        {' '}
                        •{' '}
                        {new Date(intake.completedAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    )}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No Intake Submitted
                  </Badge>
                )}
              </div>

              {!intake ? (
                <div className="bg-soft-meadow/30 border-deep-ink/10 rounded-xl border border-dashed p-6 text-center text-xs">
                  <FileText className="text-slate/40 mx-auto mb-2 h-7 w-7" />
                  <p className="text-deep-ink font-medium">
                    No intake record on file for this patient.
                  </p>
                  <p className="text-slate mt-1 text-[11px]">
                    When the patient completes their voice check-in or health
                    form, the AI-extracted clinical notes will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-1 text-xs sm:text-sm">
                  {intake.chiefComplaint && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 sm:p-4">
                      <span className="text-slate block text-[11px] font-bold tracking-wider text-amber-900/90 uppercase">
                        Primary Chief Complaint
                      </span>
                      <p className="text-deep-ink mt-1 leading-relaxed font-medium">
                        {intake.chiefComplaint}
                      </p>
                    </div>
                  )}

                  {intake.summary && (
                    <div className="space-y-1.5">
                      <span className="text-slate block text-[11px] font-bold tracking-wider uppercase">
                        Intake Summary & Present Illness
                      </span>
                      <p className="text-deep-ink bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3.5 text-xs leading-relaxed sm:text-sm">
                        {intake.summary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                    {intake.surgeries && (
                      <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3">
                        <span className="text-slate block text-[11px] font-semibold">
                          Surgical & Hospitalization History
                        </span>
                        <p className="text-deep-ink mt-1 text-xs leading-relaxed">
                          {intake.surgeries}
                        </p>
                      </div>
                    )}
                    {intake.familyHistory && (
                      <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3">
                        <span className="text-slate block text-[11px] font-semibold">
                          Family Medical History
                        </span>
                        <p className="text-deep-ink mt-1 text-xs leading-relaxed">
                          {intake.familyHistory}
                        </p>
                      </div>
                    )}
                    {intake.socialHistory && (
                      <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3 sm:col-span-2">
                        <span className="text-slate block text-[11px] font-semibold">
                          Social & Lifestyle Factors
                        </span>
                        <p className="text-deep-ink mt-1 text-xs leading-relaxed">
                          {intake.socialHistory}
                        </p>
                      </div>
                    )}
                    {intake.medicalHistory && (
                      <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3 sm:col-span-2">
                        <span className="text-slate block text-[11px] font-semibold">
                          Patient-Stated Medical History
                        </span>
                        <p className="text-deep-ink mt-1 text-xs leading-relaxed">
                          {intake.medicalHistory}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Clinical Profile Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-deep-ink/10 space-y-3 border bg-white p-5 shadow-2xs">
              <div className="text-deep-ink border-deep-ink/6 flex items-center gap-2 border-b pb-2">
                <HeartPulse className="h-4 w-4 text-emerald-600" />
                <h3 className="font-serif text-sm font-bold">
                  Active Medical Conditions
                </h3>
              </div>
              {medicalHistory.length === 0 ? (
                <div className="text-slate bg-soft-meadow/30 border-deep-ink/10 rounded-xl border border-dashed py-4 text-center text-xs">
                  <p className="italic">No active conditions recorded</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {medicalHistory.map((cond, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      {cond}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-deep-ink/10 space-y-3 border bg-white p-5 shadow-2xs">
              <div className="text-deep-ink border-deep-ink/6 flex items-center gap-2 border-b pb-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <h3 className="font-serif text-sm font-bold">
                  Known Allergies
                </h3>
              </div>
              {allergies.length === 0 ? (
                <div className="text-slate bg-soft-meadow/30 border-deep-ink/10 rounded-xl border border-dashed py-4 text-center text-xs">
                  <p className="italic">No known allergies documented</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allergies.map((allergy, idx) => (
                    <Badge
                      key={idx}
                      variant="danger"
                      className="px-2.5 py-1 text-xs"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-deep-ink/10 space-y-3 border bg-white p-5 shadow-2xs md:col-span-2">
              <div className="border-deep-ink/6 flex items-center justify-between border-b pb-2">
                <div className="text-deep-ink flex items-center gap-2">
                  <Pill className="h-4 w-4 text-amber-600" />
                  <h3 className="font-serif text-sm font-bold">
                    Current Prescriptions & Medications
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {currentMedications.length} on file
                </Badge>
              </div>
              {currentMedications.length === 0 ? (
                <div className="text-slate bg-soft-meadow/30 border-deep-ink/10 rounded-xl border border-dashed py-4 text-center text-xs">
                  <p className="italic">
                    No current medications reported on file
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  {currentMedications.map((med, idx) => (
                    <div
                      key={idx}
                      className="bg-soft-meadow/40 border-deep-ink/5 text-deep-ink flex items-center gap-2 rounded-xl border p-2.5 text-xs"
                    >
                      <span className="bg-hi-yellow h-2 w-2 shrink-0 rounded-full" />
                      <span className="truncate font-medium">{med}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Consultation History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-slate h-4 w-4" />
                <h3 className="text-deep-ink font-serif text-base font-bold sm:text-lg">
                  Consultation History
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {sessions.length} recorded
              </Badge>
            </div>

            {sessions.length === 0 ? (
              <Card className="space-y-2 rounded-2xl border-dashed bg-white/70 p-8 text-center">
                <Clock className="text-slate/30 mx-auto h-8 w-8" />
                <p className="text-slate text-xs font-medium">
                  No past consultations recorded for this patient.
                </p>
                <p className="text-slate/70 text-[11px]">
                  Completed voice sessions and AI-generated SOAP notes will be
                  stored here.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const sDate = s.startedAt
                    ? new Date(s.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';
                  const summaryText =
                    s.soapNote?.assessment ||
                    s.transcript ||
                    'Clinical consultation recorded.';

                  return (
                    <Card
                      key={s.id}
                      className="hover:border-deep-ink/30 bg-white p-4 shadow-2xs transition-all sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-slate flex flex-wrap items-center gap-2 text-xs">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{sDate}</span>
                            <span>•</span>
                            <span>
                              {doctor?.name
                                ? `Dr. ${doctor.name}`
                                : 'Clinical Center'}
                            </span>
                            <Badge
                              variant={
                                s.status === 'completed'
                                  ? 'success'
                                  : 'secondary'
                              }
                              className="px-1.5 py-0 text-[10px]"
                            >
                              {s.status}
                            </Badge>
                          </div>
                          <p className="text-deep-ink line-clamp-1 text-xs font-medium sm:text-sm">
                            {summaryText}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/doctor/sessions/${s.id}`}
                          className="shrink-0"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 cursor-pointer rounded-xl text-xs font-semibold"
                          >
                            View Clinical Note
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Provider Governance Rail */}
        <div className="space-y-4">
          <Card className="border-deep-ink/10 space-y-3 border bg-white p-5 shadow-2xs">
            <div className="text-deep-ink flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="font-serif text-sm font-bold">
                Clinical Record Security
              </h3>
            </div>
            <p className="text-slate text-xs leading-relaxed">
              Patient registered on{' '}
              <span className="text-deep-ink font-semibold">
                {patient.createdAt
                  ? new Date(patient.createdAt).toLocaleDateString()
                  : 'Active File'}
              </span>
              . All clinical consultations, AI intake summaries, and SOAP notes
              are end-to-end encrypted and linked to your National Provider
              identifier.
            </p>
          </Card>

          <Card className="border-deep-ink/10 space-y-3 border bg-white p-5 shadow-2xs">
            <h3 className="text-deep-ink font-serif text-sm font-bold">
              Provider Actions
            </h3>
            <div className="space-y-2">
              {isLinked ? (
                <Link
                  href={`/dashboard/doctor/sessions/new?patientId=${patient.id}`}
                  className="block"
                >
                  <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 w-full cursor-pointer rounded-xl text-xs font-medium shadow-2xs">
                    Start Voice Session
                  </Button>
                </Link>
              ) : (
                <div className="bg-soft-meadow/50 border-deep-ink/5 text-slate space-y-1 rounded-xl border p-3 text-xs">
                  <span className="text-deep-ink block font-semibold">
                    Voice Session Inactive
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Voice encounters and transcript processing will activate
                    automatically once the patient confirms linkage.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  if (patient.email) {
                    window.open(`mailto:${patient.email}`);
                  } else {
                    alert('No email recorded for this patient');
                  }
                }}
                className="border-deep-ink/15 text-deep-ink hover:bg-soft-meadow h-9 w-full cursor-pointer rounded-xl text-xs font-semibold"
              >
                Direct Email Patient
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyId}
                className="border-deep-ink/15 text-slate hover:text-deep-ink hover:bg-soft-meadow h-9 w-full cursor-pointer rounded-xl text-xs"
              >
                {copiedId ? 'Copied Patient ID!' : 'Copy Patient ID'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
