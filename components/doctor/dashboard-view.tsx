'use client';

import React, { useEffect, useTransition } from 'react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import type { DoctorDashboardPayload } from '@/lib/types/doctor.types';
import { refreshDoctorDashboard } from '@/app/dashboard/doctor/actions';
import {
  DoctorHeader,
  DoctorVerificationNotice,
  DoctorMetrics,
  DoctorQuickActions,
  DoctorRecentSessions,
} from '@/components/doctor';

interface DoctorDashboardViewProps {
  initialData: DoctorDashboardPayload;
}

export function DoctorDashboardView({ initialData }: DoctorDashboardViewProps) {
  const [isPending, startTransition] = useTransition();

  // Sync initial server data into Zustand store so sub-components and client routes have access
  useEffect(() => {
    useDoctorStore.setState({
      doctor: initialData.doctor,
      patients: initialData.patients,
      sessions: initialData.sessions,
      stats: initialData.stats,
      doctorId: initialData.doctor.id,
      isLoading: false,
      error: null,
    });
  }, [initialData]);

  // Read current reactive state with initial server data fallback
  const doctor = useDoctorStore((state) => state.doctor) || initialData.doctor;
  const patients =
    useDoctorStore((state) => state.patients) || initialData.patients;
  const sessions =
    useDoctorStore((state) => state.sessions) || initialData.sessions;
  const stats = useDoctorStore((state) => state.stats) || initialData.stats;

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshDoctorDashboard();
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      <DoctorHeader
        doctorName={doctor?.name}
        specialty={doctor?.specialty}
        clinic={doctor?.clinic}
        onRefresh={handleRefresh}
      />

      {doctor?.verificationStatus &&
        doctor.verificationStatus !== 'verified' && (
          <DoctorVerificationNotice
            status={doctor.verificationStatus}
            license={doctor.license}
            rejectionReason={doctor.rejectionReason}
          />
        )}

      <DoctorMetrics
        todaySessions={stats?.todaySessions || 0}
        totalPatients={stats?.totalPatients || 0}
        completedSessions={stats?.completedSessions || 0}
        pendingNotes={stats?.pendingNotes || 0}
      />

      <DoctorQuickActions />

      <DoctorRecentSessions
        sessions={sessions}
        patients={patients}
        isLoading={isPending}
      />
    </div>
  );
}
