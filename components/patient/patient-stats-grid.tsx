import { StatCard } from '@/components/ui/stat-card'
import { FileText, CheckCircle2, ClipboardList } from 'lucide-react'
import type { PatientStats } from '@/lib/types/patient.types'

interface PatientStatsGridProps {
  stats: PatientStats | null
}

export function PatientStatsGrid({ stats }: PatientStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Total Consultations"
        value={stats?.totalConsultations ?? 0}
        icon={<FileText className="h-5 w-5 text-slate" />}
      />
      <StatCard
        label="Completed Visits"
        value={stats?.completedConsultations ?? 0}
        icon={<CheckCircle2 className="h-5 w-5 text-slate" />}
      />
      <StatCard
        label="Health Intake Form"
        value={stats?.hasIntake ? 'Submitted' : 'Pending'}
        icon={<ClipboardList className="h-5 w-5 text-slate" />}
      />
    </div>
  )
}
