'use client';

import React from 'react';
import { Calendar, CheckCircle2, FileEdit, Users } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface DoctorMetricsProps {
  todaySessions: number;
  totalPatients: number;
  completedSessions: number;
  pendingNotes: number;
}

export function DoctorMetrics({
  todaySessions,
  totalPatients,
  completedSessions,
  pendingNotes,
}: DoctorMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Today's Sessions"
        value={todaySessions.toString()}
        icon={<Calendar className="h-4 w-4" />}
      />
      <StatCard
        label="Unique Patients"
        value={totalPatients.toString()}
        icon={<Users className="h-4 w-4" />}
      />
      <StatCard
        label="Completed Sessions"
        value={completedSessions.toString()}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <StatCard
        label="Pending Notes"
        value={pendingNotes.toString()}
        icon={<FileEdit className="h-4 w-4" />}
      />
    </div>
  );
}
