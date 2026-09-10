'use client';

import React from 'react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  DoctorHeader,
  DoctorVerificationNotice,
  DoctorMetrics,
  DoctorQuickActions,
  DoctorRecentSessions,
} from '@/components/doctor';

export default function DashboardPage() {
  const doctor = useDoctorStore((state) => state.doctor);
  const patients = useDoctorStore((state) => state.patients);
  const sessions = useDoctorStore((state) => state.sessions);
  const stats = useDoctorStore((state) => state.stats);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const error = useDoctorStore((state) => state.error);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  const handleRefresh = () => {
    if (typeof window === 'undefined') return;
    const storedDoctorId = window.localStorage.getItem('userId') || window.localStorage.getItem('doctorId');
    if (storedDoctorId) {
      void loadDashboard(storedDoctorId);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      <DoctorHeader
        doctorName={doctor?.name}
        specialty={doctor?.specialty}
        clinic={doctor?.clinic}
        onRefresh={handleRefresh}
      />

      {doctor?.verificationStatus && doctor.verificationStatus !== 'verified' && (
        <DoctorVerificationNotice
          status={doctor.verificationStatus}
          license={doctor.license}
          rejectionReason={doctor.rejectionReason}
        />
      )}

      {error && (!doctor?.verificationStatus || doctor.verificationStatus === 'verified') && (
        <ErrorAlert message={error} />
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
        isLoading={isLoading}
      />
    </div>
  );
}
