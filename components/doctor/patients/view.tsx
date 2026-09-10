'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import type { Patient, Doctor } from '@/lib/db';
import {
  PatientsHeader,
  CareCodeBanner,
  PatientsSearch,
  PatientsTable,
  InviteModal,
  type PatientActionNotification,
} from '@/components/doctor/patients';
import {
  invitePatient,
  respondToPatientLink,
} from '@/app/dashboard/doctor/patients/actions';

interface PatientsViewProps {
  initialDoctor: Doctor;
  initialPatients: Patient[];
}

export function PatientsView({
  initialDoctor,
  initialPatients,
}: PatientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

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

  const [linkActionLoadingId, setLinkActionLoadingId] = useState<string | null>(
    null
  );
  const [actionNotification, setActionNotification] =
    useState<PatientActionNotification | null>(null);

  // Synchronize incoming server data
  useEffect(() => {
    setPatients(initialPatients);
    useDoctorStore.setState({
      doctor: initialDoctor,
      patients: initialPatients,
      doctorId: initialDoctor.id,
    });
  }, [initialDoctor, initialPatients]);

  const careCode = initialDoctor.careCode || 'NOA-DOC';

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setInviteMessage(null);

    try {
      const res = await invitePatient({
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim(),
        lastName: inviteLastName.trim(),
        phone: invitePhone.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to add patient');
      }

      setInviteMessage({
        type: 'success',
        text: res.message || 'Patient successfully registered!',
      });
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInvitePhone('');

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

  const handleRespondLink = async (
    patientId: string,
    action: 'accept' | 'decline'
  ) => {
    if (linkActionLoadingId) return;
    setLinkActionLoadingId(patientId);
    setActionNotification(null);

    try {
      const res = await respondToPatientLink(patientId, action);
      if (!res.success) {
        throw new Error(res.error || `Failed to ${action} patient request`);
      }

      setActionNotification({
        type: 'success',
        message: res.message || `Patient request ${action}ed successfully.`,
      });
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : `Failed to ${action} patient request`;
      setActionNotification({ type: 'error', message: text });
    } finally {
      setLinkActionLoadingId(null);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    const email = (patient.email || '').toLowerCase();
    const phone = (patient.phone || '').toLowerCase();
    return (
      fullName.includes(term) || email.includes(term) || phone.includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      <PatientsHeader onAddPatient={() => setIsModalOpen(true)} />

      <CareCodeBanner careCode={careCode} />

      {actionNotification && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-lg border p-4 text-sm font-medium ${
            actionNotification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <span>{actionNotification.message}</span>
          <button
            onClick={() => setActionNotification(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <PatientsSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCount={patients.length}
        withConditionsCount={patients.filter((p) => (p.conditions?.length || 0) > 0).length}
      />

      <PatientsTable
        isLoading={false}
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
        inviteFirstName={inviteFirstName}
        inviteLastName={inviteLastName}
        invitePhone={invitePhone}
        onEmailChange={setInviteEmail}
        onFirstNameChange={setInviteFirstName}
        onLastNameChange={setInviteLastName}
        onPhoneChange={setInvitePhone}
        onSubmit={handleInviteSubmit}
        isSubmitting={isSubmittingInvite}
        inviteMessage={inviteMessage}
      />
    </div>
  );
}
