'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RefreshCw, Mic, Users, FileText } from 'lucide-react'

import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'
import { BarChart3, Calendar, CheckCircle2, Clock } from 'lucide-react'

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
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-serif">{doctor?.name || 'Welcome'}</h1>
          <div className="flex items-center gap-2 text-slate">
            {doctor?.specialty && (
              <>
                <span className="text-sm font-medium">{doctor.specialty}</span>
                <span className="text-deep-ink/20">·</span>
                <span className="text-sm font-medium">{doctor.clinic}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="rounded-full border-deep-ink/20 text-slate hover:text-deep-ink hover:bg-canvas transition-all duration-200 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/dashboard/doctor/settings">
            <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 shadow-md hover:shadow-lg transition-all duration-200">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Clock, label: 'Today\'s Sessions', value: stats?.todaySessions.toString() || '0', color: 'text-hi-yellow' },
          { icon: BarChart3, label: 'Unique Patients', value: stats?.totalPatients.toString() || '0', color: 'text-moss-green' },
          { icon: CheckCircle2, label: 'Completed', value: stats?.completedSessions.toString() || '0', color: 'text-moss-green' },
          { icon: Calendar, label: 'Pending Notes', value: stats?.pendingNotes.toString() || '0', color: 'text-fuchsia' },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="group bg-white rounded-2xl p-6 border border-deep-ink/5 hover:border-hi-yellow/20 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <p className="text-slate text-sm font-medium">{stat.label}</p>
                <Icon className={`h-5 w-5 ${stat.color} opacity-60 group-hover:scale-110 transition-transform`} />
              </div>
              <p className="text-4xl font-bold font-serif text-deep-ink">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-8 border border-deep-ink/5 shadow-sm">
        <h3 className="text-lg font-semibold font-serif mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/doctor/sessions/new" className="group">
            <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200 group-hover:translate-y-[-2px] flex items-center justify-center gap-2">
              <Mic className="h-5 w-5" />
              Start New Session
            </Button>
          </Link>
          <Link href="/dashboard/doctor/patients">
            <Button variant="outline" className="w-full rounded-full border-deep-ink/20 text-slate hover:text-deep-ink hover:bg-canvas transition-all duration-200 py-3 font-semibold flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              Search Patients
            </Button>
          </Link>
          <Link href="/dashboard/doctor/summaries">
            <Button variant="outline" className="w-full rounded-full border-deep-ink/20 text-slate hover:text-deep-ink hover:bg-canvas transition-all duration-200 py-3 font-semibold flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold font-serif">Recent Sessions</h3>
          <Link href="/dashboard/doctor/sessions/new">
            <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 shadow-md px-4 py-2 text-sm font-medium">
              New Session
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-slate">
              <div className="inline-block animate-pulse">Loading sessions...</div>
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="bg-gradient-to-br from-soft-meadow/40 to-soft-meadow/20 rounded-2xl p-12 text-center border border-deep-ink/5">
              <Mic className="h-12 w-12 text-slate/30 mx-auto mb-4" />
              <p className="text-slate mb-6">No sessions yet. Start your first consultation.</p>
              <Link href="/dashboard/doctor/sessions/new">
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 shadow-md">
                  Start New Session
                </Button>
              </Link>
            </div>
          ) : (
            recentSessions.map(session => {
              const Icon = session.status === 'completed' ? CheckCircle2 : session.status === 'active' ? Clock : Calendar
              return (
                <div
                  key={session.id}
                  className="group bg-white rounded-2xl p-6 border border-deep-ink/5 hover:border-hi-yellow/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <Icon className={`h-5 w-5 flex-shrink-0 ${
                          session.status === 'completed'
                            ? 'text-moss-green'
                            : session.status === 'active'
                              ? 'text-hi-yellow'
                              : 'text-slate'
                        }`} />
                        <h4 className="font-semibold font-serif text-deep-ink truncate">{getPatientName(session.patientId)}</h4>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                            session.status === 'completed'
                              ? 'bg-moss-green/15 text-moss-green'
                              : session.status === 'active'
                                ? 'bg-hi-yellow/15 text-deep-ink'
                                : 'bg-slate/10 text-slate'
                          }`}
                        >
                          {session.status === 'completed' ? 'Completed' : session.status === 'active' ? 'In Progress' : 'Archived'}
                        </span>
                      </div>
                      <p className="text-sm text-slate mb-2 line-clamp-2">{session.soapNote?.assessment || 'No assessment yet'}</p>
                      <div className="text-xs text-slate/70">{formatSessionTime(session.startedAt)}</div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {session.status === 'completed' && (
                        <Link href={`/dashboard/doctor/sessions/${session.id}`}>
                          <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 shadow-sm hover:shadow-md transition-all">
                            View
                          </Button>
                        </Link>
                      )}
                      {session.status === 'active' && (
                        <Link href={`/dashboard/doctor/sessions/${session.id}`}>
                          <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 shadow-sm hover:shadow-md transition-all">
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
