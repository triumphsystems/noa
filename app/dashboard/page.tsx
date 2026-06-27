'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Session {
  id: string
  patientName: string
  date: string
  duration: string
  status: 'completed' | 'in-progress' | 'pending'
  notes: string
}

const mockSessions: Session[] = [
  {
    id: '1',
    patientName: 'John Doe',
    date: 'Today at 2:00 PM',
    duration: '25 mins',
    status: 'completed',
    notes: 'Follow-up consultation for hypertension management',
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    date: 'Today at 10:30 AM',
    duration: '18 mins',
    status: 'completed',
    notes: 'Initial consultation - Migraine symptoms',
  },
  {
    id: '3',
    patientName: 'Robert Johnson',
    date: 'Tomorrow at 3:00 PM',
    duration: 'Scheduled',
    status: 'pending',
    notes: 'Annual physical examination',
  },
]

export default function DashboardPage() {
  const [sessions, setSessions] = useState(mockSessions)
  const [isRecording, setIsRecording] = useState(false)

  return (
    <div className="p-8 space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Sessions', value: '2' },
          { label: 'Patients', value: '24' },
          { label: 'This Week', value: '8' },
          { label: 'Pending Notes', value: '3' },
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
          {sessions.map(session => (
            <div
              key={session.id}
              className="bg-white rounded-3xl p-6 border border-deep-ink/10 hover:border-hi-yellow/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold font-serif text-deep-ink">{session.patientName}</h4>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        session.status === 'completed'
                          ? 'bg-moss-green/20 text-deep-ink'
                          : session.status === 'in-progress'
                            ? 'bg-hi-yellow/20 text-deep-ink'
                            : 'bg-slate/10 text-slate'
                      }`}
                    >
                      {session.status === 'completed' ? 'Completed' : session.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-slate mb-2">{session.notes}</p>
                  <div className="flex gap-4 text-xs text-slate">
                    <span>{session.date}</span>
                    <span>•</span>
                    <span>{session.duration}</span>
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
                  {session.status === 'pending' && (
                    <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                      Start
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State Message */}
      {sessions.length === 0 && (
        <div className="bg-soft-meadow/50 rounded-3xl p-12 text-center">
          <p className="text-slate mb-4">No sessions yet. Start recording your first consultation.</p>
          <Link href="/dashboard/sessions/new">
            <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              Start First Session
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
