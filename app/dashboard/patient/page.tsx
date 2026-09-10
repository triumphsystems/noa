'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePatientStore } from '@/lib/stores/patient.store';
import { useAuth } from '@/lib/auth-context';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  PatientHeader,
  PatientOverview,
  PatientVisits,
  PatientCare,
  PatientRecords,
  type PatientScreenTab,
} from '@/components/patient';

export default function PatientDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [, startTransition] = useTransition();

  const initialTab = (searchParams.get('tab') as PatientScreenTab) || 'home';
  const [activeTab, setActiveTab] = useState<PatientScreenTab>(
    ['home', 'visits', 'care-team', 'records'].includes(initialTab)
      ? initialTab
      : 'home'
  );

  const {
    patientId,
    patient,
    doctor,
    pendingDoctor,
    sessions,
    intake,
    stats,
    isLoading,
    error,
    setPatientId,
    loadDashboard,
  } = usePatientStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as PatientScreenTab;
    if (
      tabParam &&
      ['home', 'visits', 'care-team', 'records'].includes(tabParam) &&
      tabParam !== activeTab
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (newTab: string) => {
    const tab = newTab as PatientScreenTab;
    setActiveTab(tab);
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let resolvedId = patientId;
    if (!resolvedId && typeof window !== 'undefined') {
      const stored =
        window.localStorage.getItem('userId') ||
        window.localStorage.getItem('patientId');
      if (stored) {
        resolvedId = stored;
        setPatientId(stored);
      }
    }

    if (resolvedId && !patient) {
      void loadDashboard(resolvedId);
    }
  }, [patientId, patient, setPatientId, loadDashboard]);

  const handleRefresh = async () => {
    if (patientId) {
      await loadDashboard(patientId);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/auth/login');
    }
  };

  const fullName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : '';
  const hasDoctor = Boolean(patient?.doctorId && doctor);
  const isPendingApproval = patient?.linkStatus === 'pending_patient_approval';

  if (isLoading && !patient) {
    return (
      <div className="min-h-screen bg-[#f9fbf2] pb-24">
        <div className="border-deep-ink/5 flex w-full items-center justify-between border-b bg-white/80 p-4 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="bg-deep-ink/10 h-6 w-28 animate-pulse rounded-full" />
          <div className="bg-deep-ink/10 h-9 w-9 animate-pulse rounded-full" />
        </div>
        <div className="w-full animate-pulse space-y-4 p-4 pt-4 sm:p-6 lg:p-8">
          <div className="border-deep-ink/5 h-32 rounded-2xl border bg-white shadow-2xs" />
          <div className="grid grid-cols-3 gap-2.5">
            <div className="border-deep-ink/5 h-20 rounded-xl border bg-white shadow-2xs" />
            <div className="border-deep-ink/5 h-20 rounded-xl border bg-white shadow-2xs" />
            <div className="border-deep-ink/5 h-20 rounded-xl border bg-white shadow-2xs" />
          </div>
          <div className="border-deep-ink/5 h-44 rounded-2xl border bg-white shadow-2xs" />
          <div className="border-deep-ink/5 h-36 rounded-2xl border bg-white shadow-2xs" />
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fbf2] p-4">
        <div className="w-full max-w-md space-y-4">
          <ErrorAlert
            variant="card"
            title="Unable to Load Health Portal"
            message={error}
          />
          <div className="text-center">
            <Button
              variant="outline"
              className="rounded-full px-6 text-xs font-semibold"
              onClick={() => patientId && void loadDashboard(patientId)}
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-deep-ink select-none-headers min-h-screen bg-[#f9fbf2] pb-28 font-sans antialiased">
      <main className="w-full space-y-5 px-4 pt-4 sm:px-6 sm:pt-6 lg:space-y-6 lg:px-8">
        <PatientHeader
          patientName={patient?.firstName}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          sessionsCount={sessions.length}
          isPendingApproval={isPendingApproval}
        />

        {activeTab === 'home' && (
          <PatientOverview
            fullName={fullName}
            hasDoctor={hasDoctor}
            doctor={doctor}
            pendingDoctor={pendingDoctor}
            isPendingApproval={isPendingApproval}
            sessions={sessions}
            intake={intake}
            patient={patient}
            stats={stats}
            onNavigateTab={handleTabChange}
          />
        )}

        {activeTab === 'visits' && (
          <PatientVisits sessions={sessions} doctor={doctor} />
        )}

        {activeTab === 'care-team' && (
          <PatientCare
            hasDoctor={hasDoctor}
            doctor={doctor}
            pendingDoctor={pendingDoctor}
            patient={patient}
            patientId={patientId}
            isPendingApproval={isPendingApproval}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'records' && (
          <PatientRecords
            patient={patient}
            intake={intake}
            onLogout={handleLogout}
          />
        )}
      </main>

      <div className="sm:hidden">
        <BottomNav
          role="patient"
          activeTab={activeTab}
          onTabChange={handleTabChange}
          badgeCounts={{
            visits: sessions.length > 0 ? sessions.length : undefined,
            'care-team': isPendingApproval ? '1' : undefined,
          }}
          floatingDockOnDesktop={false}
        />
      </div>
    </div>
  );
}
