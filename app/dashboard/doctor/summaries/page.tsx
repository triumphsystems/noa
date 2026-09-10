'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import type { Patient } from '@/lib/db';
import {
  SummariesHeader,
  SummariesFilter,
  SummariesGrid,
} from '@/components/doctor/summaries';

export default function SummariesPage() {
  const doctorId = useDoctorStore((state) => state.doctorId);
  const sessions = useDoctorStore((state) => state.sessions);
  const patients = useDoctorStore((state) => state.patients);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const error = useDoctorStore((state) => state.error);
  const lastLoadedDoctorId = useDoctorStore((state) => state.lastLoadedDoctorId);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all');

  useEffect(() => {
    let resolvedDoctorId = doctorId;
    if (!resolvedDoctorId && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('userId') || window.localStorage.getItem('doctorId');
      if (stored) {
        resolvedDoctorId = stored;
        useDoctorStore.getState().setDoctorId(stored);
      }
    }

    if (
      resolvedDoctorId &&
      lastLoadedDoctorId !== resolvedDoctorId &&
      !isLoading
    ) {
      void loadDashboard(resolvedDoctorId);
    }
  }, [doctorId, lastLoadedDoctorId, isLoading, loadDashboard]);

  const handleRefresh = () => {
    const activeId =
      doctorId ||
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('userId') || window.localStorage.getItem('doctorId')
        : null);
    if (activeId) {
      void loadDashboard(activeId);
    }
  };

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const sessionsWithSummaries = useMemo(() => {
    return sessions.filter(
      (s) =>
        Boolean(s.soapNote) ||
        Boolean(s.transcript) ||
        s.status === 'completed' ||
        s.status === 'active'
    );
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filterStatus === 'all') return sessionsWithSummaries;
    return sessionsWithSummaries.filter((s) => s.status === filterStatus);
  }, [sessionsWithSummaries, filterStatus]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <SummariesHeader isLoading={isLoading} onRefresh={handleRefresh} />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-2 cursor-pointer font-semibold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      <SummariesFilter filterStatus={filterStatus} onFilterChange={setFilterStatus} />

      <SummariesGrid
        isLoading={isLoading}
        sessions={filteredSessions}
        patientMap={patientMap}
        filterStatus={filterStatus}
      />
    </div>
  );
}
