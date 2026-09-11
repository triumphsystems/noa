'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePatientStore } from '@/lib/stores/patient.store';
import { useAuth } from '@/lib/auth-context';
import { BottomNav } from '@/components/navigation/bottom-nav';
import type { PatientDashboardPayload } from '@/lib/types/patient.types';
import { refreshPatientDashboard } from '@/app/dashboard/patient/actions';
import {
  PatientHeader,
  PatientOverview,
  PatientVisits,
  PatientCare,
  PatientRecords,
  PatientFab,
  type PatientScreenTab,
} from '@/components/patient';

interface PatientDashboardViewProps {
  initialData: PatientDashboardPayload;
}

export function PatientDashboardView({
  initialData,
}: PatientDashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [isRefreshing, startTransition] = useTransition();

  const initialTab = (searchParams.get('tab') as PatientScreenTab) || 'home';
  const [activeTab, setActiveTab] = useState<PatientScreenTab>(
    ['home', 'visits', 'care-team', 'records'].includes(initialTab)
      ? initialTab
      : 'home'
  );

  // Sync initial server data into Zustand store so sub-components and modals have access
  useEffect(() => {
    usePatientStore.setState({
      patient: initialData.patient,
      doctor: initialData.doctor,
      pendingDoctor: initialData.pendingDoctor,
      sessions: initialData.sessions,
      intake: initialData.intake,
      stats: initialData.stats,
      patientId: initialData.patient.id,
      isLoading: false,
      error: null,
    });
  }, [initialData]);

  // Read reactive store state with initial server data fallback
  const patient =
    usePatientStore((state) => state.patient) || initialData.patient;
  const doctor = useDoctorStoreDoctor(initialData.doctor);
  const pendingDoctor =
    usePatientStore((state) => state.pendingDoctor) ??
    initialData.pendingDoctor ??
    null;
  const sessions =
    usePatientStore((state) => state.sessions) || initialData.sessions;
  const intake = usePatientStore((state) => state.intake) ?? initialData.intake;
  const stats = usePatientStore((state) => state.stats) || initialData.stats;
  const patientId = patient?.id || initialData.patient.id;

  function useDoctorStoreDoctor(fallback: typeof initialData.doctor) {
    const storeDoctor = usePatientStore((state) => state.doctor);
    return storeDoctor ?? fallback;
  }

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

  const handleRefresh = async () => {
    startTransition(async () => {
      await refreshPatientDashboard();
    });
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

  return (
    <div className="text-deep-ink select-none-headers min-h-screen bg-[#f9fbf2] pb-28 font-sans antialiased">
      <main className="w-full space-y-5 px-4 pt-4 sm:px-6 sm:pt-6 lg:space-y-6 lg:px-8">
        <PatientHeader
          patientName={patient?.firstName}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isLoading={isRefreshing}
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
        <PatientFab />
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
