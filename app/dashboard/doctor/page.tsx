'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

interface SessionData {
  id: string
  patientId: string
  doctorId: string
  startedAt: number
  endedAt?: number
  status: 'active' | 'completed' | 'archived'
  soapNote?: { subjective: string; objective: string; assessment: string; plan: string }
  transcript?: string
}

interface PatientData {
  id: string
  firstName: string
  lastName: string
  email: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardPage() {
  const [doctorId, setDoctorId] = useState<string>('')
  const [patients, setPatients] = useState<Map<string, PatientData>>(new Map())

  // Fetch doctor ID from session or localStorage (would come from auth context)
  useEffect(() => {
    const storedDoctorId = localStorage.getItem('doctorId') || 'doctor-demo'
    setDoctorId(storedDoctorId)
  }, [])

  // Fetch sessions from DynamoDB
  const { data: sessionsData, isLoading: sessionsLoading } = useSWR(
    doctorId ? `/api/sessions?doctorId=${doctorId}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  )

  const sessions: SessionData[] = sessionsData?.sessions || []

  // Fetch patient names for each session
  useEffect(() => {
    const fetchPatients = async () => {
      const newPatients = new Map(patients)
      for (const session of sessions) {
        if (!newPatients.has(session.patientId)) {
          try {
            const res = await fetch(`/api/patients/${session.patientId}`)
            if (res.ok) {
              const data = await res.json()
              newPatients.set(session.patientId, data.patient)
            }
          } catch (err) {
            console.error('Error fetching patient:', err)
          }
        }
      }
      setPatients(newPatients)
    }
    if (sessions.length > 0) {
      fetchPatients()
    }
  }, [sessions, patients])

  const todaySessions = sessions.filter(s => {
    const date = new Date(s.startedAt)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }).length

  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const pendingNotes = sessions.filter(s => s.status === 'active' && !s.soapNote).length

  return (
    <div className="p-8 space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Sessions', value: todaySessions.toString() },
          { label: 'Unique Patients', value: patients.size.toString() },
          { label: 'Completed Sessions', value: completedSessions.toString() },
          { label: 'Pending Notes', value: pendingNotes.toString() },
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
          <Link href="/dashboard/sessions/new">
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
          {sessionsLoading ? (
            <div className="text-center py-8 text-slate">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="bg-soft-meadow/50 rounded-3xl p-8 text-center">
              <p className="text-slate mb-4">No sessions yet. Start your first consultation.</p>
              <Link href="/dashboard/sessions/new">
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                  Start New Session
                </Button>
              </Link>
            </div>
          ) : (
            sessions.slice(0, 5).map(session => {
              const patient = patients.get(session.patientId)
              const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
              const date = new Date(session.startedAt)
              const dateStr = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-3xl p-6 border border-deep-ink/10 hover:border-hi-yellow/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold font-serif text-deep-ink">{patientName}</h4>
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
                        <span>{dateStr}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {session.status === 'completed' && (
                        <Link href={`/dashboard/sessions/${session.id}`}>
                          <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                            View Note
                          </Button>
                        </Link>
                      )}
                      {session.status === 'active' && (
                        <Link href={`/dashboard/sessions/${session.id}`}>
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
