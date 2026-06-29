'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'

export default function DashboardPage() {
  const doctor = useDoctorDashboardStore(state => state.doctor)
  const patients = useDoctorDashboardStore(state => state.patients)
  const sessions = useDoctorDashboardStore(state => state.sessions)
  const stats = useDoctorDashboardStore(state => state.stats)
  const isLoading = useDoctorDashboardStore(state => state.isLoading)
  const error = useDoctorDashboardStore(state => state.error)
  const loadDashboard = useDoctorDashboardStore(state => state.loadDashboard)

  const handleRefresh = () => {
    if (typeof window === 'undefined') {
      return
    }

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
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">{doctor?.name || 'Doctor Dashboard'}</h1>
          <p className="text-slate">
            {doctor ? `${doctor.specialty} · ${doctor.clinic}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/dashboard/doctor/settings">
            <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Sessions', value: stats?.todaySessions.toString() || '0' },
          { label: 'Unique Patients', value: stats?.totalPatients.toString() || '0' },
          { label: 'Completed Sessions', value: stats?.completedSessions.toString() || '0' },
          { label: 'Pending Notes', value: stats?.pendingNotes.toString() || '0' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-soft-meadow rounded-3xl p-6 border border-deep-ink/10">
            <p className="text-slate text-sm font-medium mb-2">{stat.label}</p>
            <p className="text-3xl font-bold font-serif text-deep-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl p-8 border border-deep-ink/10">
        <h3 className="text-xl font-semibold font-serif mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/doctor/sessions/new">
            <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 py-3">
              Start New Session
            </Button>
          </Link>
          <Button variant="outline" className="w-full rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow py-3">
            Search Patients
          </Button>
          <Button variant="outline" className="w-full rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow py-3">
            View Reports
          </Button>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold font-serif">Recent Sessions</h3>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-slate">Loading sessions...</div>
          ) : recentSessions.length === 0 ? (
            <div className="bg-soft-meadow/50 rounded-3xl p-8 text-center">
              <p className="text-slate mb-4">No sessions yet. Start your first consultation.</p>
              <Link href="/dashboard/doctor/sessions/new">
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                  Start New Session
                </Button>
              </Link>
            </div>
          ) : (
            recentSessions.map(session => {
              return (
                <div
                  key={session.id}
                  className="bg-white rounded-3xl p-6 border border-deep-ink/10 hover:border-hi-yellow/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold font-serif text-deep-ink">{getPatientName(session.patientId)}</h4>
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            session.status === 'completed'
                              ? 'bg-moss-green/20 text-deep-ink'
                              : session.status === 'active'
                                ? 'bg-hi-yellow/20 text-deep-ink'
                                : 'bg-slate/10 text-slate'
                          }`}
                        >
                            {session.status === 'completed' ? 'Completed' : session.status === 'active' ? 'In Progress' : 'Archived'}
                          </span>
                      </div>
                      <p className="text-sm text-slate mb-2">{session.soapNote?.assessment || 'No assessment yet'}</p>
                      <div className="flex gap-4 text-xs text-slate">
                          <span>{formatSessionTime(session.startedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {session.status === 'completed' && (
                        <Link href={`/dashboard/doctor/sessions/${session.id}`}>
                          <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                            View Note
                          </Button>
                        </Link>
                      )}
                      {session.status === 'active' && (
                        <Link href={`/dashboard/doctor/sessions/${session.id}`}>
                          <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                            Continue
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
