'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  UserPlus,
  Users,
  Copy,
  Check,
  Share2,
  X,
  Loader2,
  Mail,
  User,
  Phone,
  Clock,
  CheckCircle2,
} from 'lucide-react';

import { useDoctorStore } from '@/lib/stores/doctor.store';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/db';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite modal form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const doctorId = useDoctorStore((state) => state.doctorId);
  const doctor = useDoctorStore((state) => state.doctor);
  const patients = useDoctorStore((state) => state.patients);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  useEffect(() => {
    if (doctorId && patients.length === 0 && !isLoading) {
      void loadDashboard(doctorId);
    }
  }, [doctorId, patients.length, isLoading, loadDashboard]);

  const careCode =
    doctor?.careCode ||
    (doctorId
      ? `NOA-${doctorId
          .replace('doctor-', '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 6)
          .toUpperCase()}`
      : 'NOA-DOC');

  const copyCareCode = () => {
    if (typeof navigator !== 'undefined') {
      void navigator.clipboard.writeText(careCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyIntakeLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/intake?doctorCode=${encodeURIComponent(careCode)}`;
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setInviteMessage(null);

    try {
      const res = await fetch('/api/patients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          firstName: inviteFirstName.trim(),
          lastName: inviteLastName.trim(),
          phone: invitePhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add patient');
      }

      setInviteMessage({
        type: 'success',
        text: data.message || 'Patient successfully registered!',
      });
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInvitePhone('');
      if (doctorId) {
        await loadDashboard(doctorId);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setInviteMessage(null);
      }, 2000);
    } catch (err: any) {
      setInviteMessage({
        type: 'error',
        text: err.message || 'Failed to add patient',
      });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const [linkActionLoadingId, setLinkActionLoadingId] = useState<string | null>(
    null
  );
  const [actionNotification, setActionNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleRespondLink = async (
    patientId: string,
    action: 'accept' | 'decline'
  ) => {
    if (linkActionLoadingId) return;
    setLinkActionLoadingId(patientId);
    setActionNotification(null);

    try {
      const res = await fetch('/api/doctors/respond-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, action }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || `Failed to ${action} patient request`);

      setActionNotification({
        type: 'success',
        message:
          data.message ||
          (action === 'accept'
            ? 'Patient connection approved.'
            : 'Patient connection declined.'),
      });

      if (doctorId) {
        await loadDashboard(doctorId);
      }
    } catch (err: any) {
      setActionNotification({
        type: 'error',
        message: err?.message || `Failed to ${action} patient request`,
      });
    } finally {
      setLinkActionLoadingId(null);
    }
  };

  const allPatients: Patient[] = patients;

  const filteredPatients = allPatients.filter(
    (patient) =>
      `${patient.firstName || ''} ${patient.lastName || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const withConditionsCount = allPatients.filter(
    (patient: Patient) => (patient.conditions?.length || 0) > 0
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-deep-ink mb-1 font-serif text-2xl font-bold sm:text-3xl">
            Patients
          </h1>
          <p className="text-slate text-xs sm:text-sm">
            Manage and review your patient registry
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full cursor-pointer gap-2 rounded-full text-xs font-medium shadow-2xs sm:w-auto sm:text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotification && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl p-4 font-sans text-sm transition-all',
            actionNotification.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-rose-200 bg-rose-50 text-rose-900'
          )}
        >
          <span>{actionNotification.message}</span>
          <button
            onClick={() => setActionNotification(null)}
            className="ml-4 cursor-pointer font-bold hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Doctor Care Code & Share Card */}
      <Card className="border-deep-ink/10 bg-canvas/40 flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 backdrop-blur-sm sm:p-5 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate text-xs font-semibold tracking-wider uppercase">
              Your Doctor Care Code:
            </span>
            <span className="border-deep-ink/10 text-deep-ink rounded-md border bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-widest shadow-2xs">
              {careCode}
            </span>
          </div>
          <p className="text-slate text-xs">
            Patients can enter this code in their portal or start an intake
            directly with your pre-configured link.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={copyCareCode}
            className="border-deep-ink/15 hover:border-deep-ink/30 flex-1 cursor-pointer gap-1.5 rounded-full text-xs md:flex-initial"
          >
            {copiedCode ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyIntakeLink}
            className="border-deep-ink/15 hover:border-deep-ink/30 flex-1 cursor-pointer gap-1.5 rounded-full text-xs md:flex-initial"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span>{copiedLink ? 'Link Copied!' : 'Share Intake Link'}</span>
          </Button>
        </div>
      </Card>

      {/* Search Bar */}
      <Card className="flex items-center gap-3 p-2 px-4">
        <Search className="text-slate h-5 w-5 shrink-0" />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-deep-ink placeholder-slate w-full bg-transparent py-2 text-base focus:outline-none sm:text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-slate hover:text-deep-ink cursor-pointer px-2 py-1 text-xs font-medium"
          >
            Clear
          </button>
        )}
      </Card>

      {/* Patient Stats Badges */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        <Badge
          variant="secondary"
          className="px-3 py-1.5 text-xs font-medium sm:px-4"
        >
          Total Patients: {allPatients.length}
        </Badge>
        <Badge
          variant="success"
          className="px-3 py-1.5 text-xs font-medium sm:px-4"
        >
          With Conditions: {withConditionsCount}
        </Badge>
      </div>

      {/* Patients Table & Mobile Card List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="text-slate p-12 text-center text-sm">
            Loading patient records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="text-slate/50 h-8 w-8" />}
              title="No patients found"
              description={
                searchTerm
                  ? `No patient records matching "${searchTerm}".`
                  : 'No patient records available yet.'
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="divide-deep-ink/10 divide-y md:hidden">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="hover:bg-soft-meadow/30 space-y-3 p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-deep-ink text-base font-semibold">
                          {[patient.firstName, patient.lastName]
                            .filter(Boolean)
                            .join(' ')
                            .trim() ||
                            patient.email ||
                            'Patient'}
                        </h4>
                        {patient.linkStatus === 'pending_patient_approval' && (
                          <Badge
                            variant="secondary"
                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                          >
                            Pending Invite
                          </Badge>
                        )}
                        {patient.linkStatus === 'pending_doctor_approval' && (
                          <Badge
                            variant="secondary"
                            className="border-blue-200 bg-blue-50 text-[10px] text-blue-800"
                          >
                            Connection Request
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate mt-0.5 truncate text-xs">
                        {patient.email}
                      </p>
                    </div>
                    {patient.linkStatus === 'pending_doctor_approval' ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRespondLink(patient.id, 'accept')
                          }
                          disabled={linkActionLoadingId === patient.id}
                          className="h-7 rounded-full bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRespondLink(patient.id, 'decline')
                          }
                          disabled={linkActionLoadingId === patient.id}
                          className="h-7 rounded-full border-rose-200 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Decline
                        </Button>
                      </div>
                    ) : patient.linkStatus === 'pending_patient_approval' ? (
                      <span className="shrink-0 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                        Pending Acceptance
                      </span>
                    ) : (
                      <Link
                        href={`/dashboard/doctor/patients/${patient.id}`}
                        className="text-deep-ink hover:text-deep-ink/70 border-deep-ink/15 hover:border-deep-ink/30 inline-flex shrink-0 items-center rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-2xs"
                      >
                        View Record
                      </Link>
                    )}
                  </div>

                  <div className="text-slate border-deep-ink/5 grid grid-cols-2 gap-2 border-t pt-1 text-xs">
                    <div>
                      <span className="text-slate/70">Phone: </span>
                      <span className="text-deep-ink">
                        {patient.phone ||
                          (patient.linkStatus === 'pending_patient_approval'
                            ? 'Hidden (pending)'
                            : '—')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate/70">DOB: </span>
                      <span className="text-deep-ink">
                        {patient.dateOfBirth ||
                          (patient.linkStatus === 'pending_patient_approval'
                            ? 'Hidden (pending)'
                            : '—')}
                      </span>
                    </div>
                  </div>

                  {patient.conditions && patient.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {patient.conditions.map((condition, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="px-2 py-0.5 text-[10px]"
                        >
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-deep-ink/10 bg-soft-meadow/60 border-b">
                    <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                      Name
                    </th>
                    <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                      Email
                    </th>
                    <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                      Phone
                    </th>
                    <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                      DOB
                    </th>
                    <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                      Status
                    </th>
                    <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                      Conditions
                    </th>
                    <th className="text-slate px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-deep-ink/5 divide-y">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-soft-meadow/40 transition-colors"
                    >
                      <td className="text-deep-ink px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {[patient.firstName, patient.lastName]
                          .filter(Boolean)
                          .join(' ')
                          .trim() ||
                          patient.email ||
                          'Patient'}
                      </td>
                      <td className="text-slate px-6 py-4 text-sm whitespace-nowrap">
                        {patient.email || '—'}
                      </td>
                      <td className="text-slate px-6 py-4 text-sm whitespace-nowrap">
                        {patient.linkStatus === 'pending_patient_approval' ? (
                          <span className="text-slate/60 text-xs italic">
                            Hidden
                          </span>
                        ) : (
                          patient.phone || '—'
                        )}
                      </td>
                      <td className="text-slate px-6 py-4 text-sm whitespace-nowrap">
                        {patient.linkStatus === 'pending_patient_approval' ? (
                          <span className="text-slate/60 text-xs italic">
                            Hidden
                          </span>
                        ) : (
                          patient.dateOfBirth || '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {patient.linkStatus === 'pending_patient_approval' && (
                          <Badge
                            variant="secondary"
                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                          >
                            <Clock className="mr-1 inline h-3 w-3" />
                            Pending Invite
                          </Badge>
                        )}
                        {patient.linkStatus === 'pending_doctor_approval' && (
                          <Badge
                            variant="secondary"
                            className="border-blue-200 bg-blue-50 text-[10px] text-blue-800"
                          >
                            <Clock className="mr-1 inline h-3 w-3" />
                            Connection Request
                          </Badge>
                        )}
                        {patient.linkStatus !== 'pending_patient_approval' &&
                          patient.linkStatus !== 'pending_doctor_approval' && (
                            <Badge
                              variant="secondary"
                              className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                            >
                              <CheckCircle2 className="mr-1 inline h-3 w-3" />
                              Active
                            </Badge>
                          )}
                      </td>
                      <td className="text-slate px-6 py-4 text-sm">
                        {patient.linkStatus === 'pending_patient_approval' ? (
                          <span className="text-slate/50 text-xs italic">
                            Locked
                          </span>
                        ) : (
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {patient.conditions &&
                            patient.conditions.length > 0 ? (
                              patient.conditions
                                .slice(0, 2)
                                .map((condition, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="px-2 py-0.5 text-[11px]"
                                  >
                                    {condition}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-slate/60 text-xs">—</span>
                            )}
                            {(patient.conditions?.length || 0) > 2 && (
                              <span className="text-slate text-xs font-medium">
                                +{patient.conditions!.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {patient.linkStatus === 'pending_doctor_approval' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleRespondLink(patient.id, 'accept')
                              }
                              disabled={linkActionLoadingId === patient.id}
                              className="h-8 cursor-pointer rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleRespondLink(patient.id, 'decline')
                              }
                              disabled={linkActionLoadingId === patient.id}
                              className="h-8 cursor-pointer rounded-full border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Decline
                            </Button>
                          </div>
                        ) : patient.linkStatus ===
                          'pending_patient_approval' ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                            Pending Acceptance
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/doctor/patients/${patient.id}`}
                            className="text-deep-ink hover:text-deep-ink/70 border-deep-ink/15 hover:border-deep-ink/30 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                          >
                            View Record
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="border-deep-ink/10 relative w-full max-w-md space-y-5 rounded-2xl border bg-white p-6 shadow-xl">
            <div className="border-deep-ink/10 flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-soft-meadow text-deep-ink flex h-8 w-8 items-center justify-center rounded-lg">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="text-deep-ink font-serif text-lg font-bold">
                  Add Patient Record
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setInviteMessage(null);
                }}
                className="text-slate hover:text-deep-ink cursor-pointer rounded-md p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteMessage && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                  inviteMessage.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border border-rose-200 bg-rose-50 text-rose-900'
                }`}
              >
                <span>{inviteMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                  <Mail className="text-slate h-3.5 w-3.5" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                />
                <p className="text-slate text-[10px]">
                  If the patient already has a Noa account, an invitation
                  request will appear on their portal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                    <User className="text-slate h-3.5 w-3.5" />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="Jane"
                    className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Doe"
                    className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                  <Phone className="text-slate h-3.5 w-3.5" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setInviteMessage(null);
                  }}
                  className="rounded-full px-4 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingInvite || !inviteEmail.trim()}
                  className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer rounded-full px-5 text-xs font-medium shadow-2xs"
                >
                  {isSubmittingInvite ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Add / Send Invite'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
