'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, Patient } from '@/lib/db';
import {
  SummariesHeader,
  SummariesFilter,
  SummariesGrid,
} from '@/components/doctor/summaries';

interface SummariesViewProps {
  initialSessions: Session[];
  initialPatients: Patient[];
}

export function SummariesView({
  initialSessions,
  initialPatients,
}: SummariesViewProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'active'
  >('all');

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    initialPatients.forEach((p) => map.set(p.id, p));
    return map;
  }, [initialPatients]);

  const sessionsWithSummaries = useMemo(() => {
    return initialSessions.filter(
      (s) =>
        Boolean(s.soapNote) ||
        Boolean(s.transcript) ||
        s.status === 'completed' ||
        s.status === 'active'
    );
  }, [initialSessions]);

  const filteredSessions = useMemo(() => {
    if (filterStatus === 'all') return sessionsWithSummaries;
    return sessionsWithSummaries.filter((s) => s.status === filterStatus);
  }, [sessionsWithSummaries, filterStatus]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <SummariesHeader isLoading={isRefreshing} onRefresh={handleRefresh} />

      <SummariesFilter
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      <SummariesGrid
        isLoading={isRefreshing}
        sessions={filteredSessions}
        patientMap={patientMap}
        filterStatus={filterStatus}
      />
    </div>
  );
}
