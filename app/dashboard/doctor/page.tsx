'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar, CheckCircle2, Clock, FileEdit, Plus, RefreshCw, Search, Users } from 'lucide-react'

import { useDoctorStore } from '@/lib/stores/doctor.store'

export default function DashboardPage() {
  const doctor = useDoctorStore(state => state.doctor)
  const patients = useDoctorStore(state => state.patients)
  const sessions = useDoctorStore(state => state.sessions)
  const stats = useDoctorStore(state => state.stats)
  const isLoading = useDoctorStore(state => state.isLoading)
  const error = useDoctorStore(state => state.error)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

  const handleRefresh = () => {
    if (typeof window === 'undefined') return
    const storedDoctorId = window.localStorage.getItem('doctorId')
    if (storedDoctorId) {
      void loadDashboard(storedDoctorId)
    }
  }

  const getPatientName = (patientId: string) => {
    const patient = patients.find(entry => entry.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
  }

  const formatSessionTime = (startedAt: number) => {
    const date = new Date(startedAt)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  const recentSessions = sessions.slice(0, 5)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-1 text-deep-ink">{doctor?.name || 'Doctor Dashboard'}</h1>
          <p className="text-slate text-xs sm:text-sm">
            {doctor ? `${doctor.specialty} · ${doctor.clinic}` : 'Welcome back to your practice'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-lg gap-2 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link href="/dashboard/doctor/settings" className="flex-1 sm:flex-initial">
            <Button size="sm" className="w-full sm:w-auto rounded-lg text-xs font-semibold">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sessions"
          value={stats?.todaySessions.toString() || '0'}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Unique Patients"
          value={stats?.totalPatients.toString() || '0'}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Completed Sessions"
          value={stats?.completedSessions.toString() || '0'}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pending Notes"
          value={stats?.pendingNotes.toString() || '0'}
          icon={<FileEdit className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/dashboard/doctor/sessions/new" className="block">
              <Button className="w-full rounded-lg py-2.5 h-10 font-semibold gap-2 text-xs">
                <Plus className="h-4 w-4" />
                Start New Session
              </Button>
            </Link>
            <Link href="/dashboard/doctor/patients" className="block">
              <Button variant="outline" className="w-full rounded-lg py-2.5 h-10 font-medium gap-2 text-xs">
                <Search className="h-4 w-4" />
                Search Patients
              </Button>
            </Link>
            <Link href="/dashboard/doctor/summaries" className="block">
              <Button variant="outline" className="w-full rounded-lg py-2.5 h-10 font-medium gap-2 text-xs">
                <FileEdit className="h-4 w-4" />
                Review Summaries
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium font-serif text-deep-ink">Recent Sessions</h3>
          {sessions.length > 0 && (
            <Link href="/dashboard/doctor/sessions/new" className="text-xs font-medium text-slate hover:text-deep-ink">
              View all sessions →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate text-xs">Loading sessions...</div>
        ) : recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Start your first AI-assisted clinical consultation to see transcripts and SOAP notes here."
            action={
              <Link href="/dashboard/doctor/sessions/new">
                <Button size="sm" className="rounded-lg gap-2 text-xs font-semibold">
                  <Plus className="h-4 w-4" />
                  Start New Session
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentSessions.map(session => (
              <Card
                key={session.id}
                className="hover:border-hi-yellow/60 transition-colors p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h4 className="font-semibold font-serif text-deep-ink text-base">
                        {getPatientName(session.patientId)}
                      </h4>
                      <Badge
                        variant={
                          session.status === 'completed'
                            ? 'success'
                            : session.status === 'active'
                              ? 'default'
                              : 'draft'
                        }
                      >
                        {session.status === 'completed'
                          ? 'Completed'
                          : session.status === 'active'
                            ? 'In Progress'
                            : 'Archived'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate line-clamp-1">
                      {session.soapNote?.assessment || 'No clinical assessment yet'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate pt-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatSessionTime(session.startedAt)}</span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    <Link href={`/dashboard/doctor/sessions/${session.id}`} className="block sm:inline">
                      <Button
                        size="sm"
                        variant={session.status === 'completed' ? 'secondary' : 'default'}
                        className="w-full sm:w-auto rounded-full font-medium"
                      >
                        {session.status === 'completed' ? 'View Note' : 'Continue Session'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
