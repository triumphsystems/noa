'use client';

import React, { useEffect, useState } from 'react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/db';
import {
  PatientsHeader,
  CareCodeBanner,
  PatientsSearch,
  PatientsTable,
  InviteModal,
  type PatientActionNotification,
} from '@/components/doctor/patients';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const [linkActionLoadingId, setLinkActionLoadingId] = useState<string | null>(null);
  const [actionNotification, setActionNotification] = useState<PatientActionNotification | null>(null);

  const doctorId = useDoctorStore((state) => state.doctorId);
  const doctor = useDoctorStore((state) => state.doctor);
  const patients = useDoctorStore((state) => state.patients);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const lastLoadedDoctorId = useDoctorStore((state) => state.lastLoadedDoctorId);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  useEffect(() => {
    if (doctorId && lastLoadedDoctorId !== doctorId && !isLoading) {
      void loadDashboard(doctorId);
    }
  }, [doctorId, lastLoadedDoctorId, isLoading, loadDashboard]);

  const careCode =
    doctor?.careCode ||
    (doctorId
      ? `NOA-${doctorId
          .replace('doctor-', '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 6)
          .toUpperCase()}`
      : 'NOA-DOC');

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
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to add patient';
      setInviteMessage({ type: 'error', text });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRespondLink = async (patientId: string, action: 'accept' | 'decline') => {
    if (linkActionLoadingId) return;
    setLinkActionLoadingId(patientId);
    setActionNotification(null);

    try {
      const res = await fetch('/api/doctors/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${action} patient request`);

      setActionNotification({
        type: 'success',
        message:
          data.message ||
          (action === 'accept' ? 'Patient connection approved.' : 'Patient connection declined.'),
      });

      if (doctorId) {
        await loadDashboard(doctorId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${action} patient request`;
      setActionNotification({ type: 'error', message });
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
      <PatientsHeader onAddPatient={() => setIsModalOpen(true)} />

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

      <CareCodeBanner careCode={careCode} />

      <PatientsSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCount={allPatients.length}
        withConditionsCount={withConditionsCount}
      />

      <PatientsTable
        isLoading={isLoading}
        patients={filteredPatients}
        searchTerm={searchTerm}
        linkActionLoadingId={linkActionLoadingId}
        onRespondLink={handleRespondLink}
      />

      <InviteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInviteMessage(null);
        }}
        inviteEmail={inviteEmail}
        onEmailChange={setInviteEmail}
        inviteFirstName={inviteFirstName}
        onFirstNameChange={setInviteFirstName}
        inviteLastName={inviteLastName}
        onLastNameChange={setInviteLastName}
        invitePhone={invitePhone}
        onPhoneChange={setInvitePhone}
        isSubmitting={isSubmittingInvite}
        inviteMessage={inviteMessage}
        onSubmit={handleInviteSubmit}
      />
    </div>
  );
}
