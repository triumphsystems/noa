'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar, FileText, ArrowRight, User } from 'lucide-react'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import type { Session, Patient } from '@/lib/db'

export default function SummariesPage() {
  const doctorId = useDoctorStore(state => state.doctorId)
  const sessions = useDoctorStore(state => state.sessions)
  const patients = useDoctorStore(state => state.patients)
  const isLoading = useDoctorStore(state => state.isLoading)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all')

  useEffect(() => {
    if (doctorId && sessions.length === 0 && !isLoading) {
      void loadDashboard(doctorId)
    }
  }, [doctorId, sessions.length, isLoading, loadDashboard])

  // Map patientId -> Patient
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>()
    patients.forEach(p => map.set(p.id, p))
    return map
  }, [patients])

  // Filter sessions that have SOAP notes or completed consultations
  const sessionsWithSummaries = useMemo(() => {
    return sessions.filter(s => Boolean(s.soapNote) || s.status === 'completed')
  }, [sessions])

  const filteredSessions = useMemo(() => {
    if (filterStatus === 'all') return sessionsWithSummaries
    return sessionsWithSummaries.filter(s => s.status === filterStatus)
  }, [sessionsWithSummaries, filterStatus])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-1 text-deep-ink">Clinical Summaries</h1>
        <p className="text-slate text-xs sm:text-sm">Review, verify, and export live consultation notes and SOAP assessments</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'completed', 'active'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors shrink-0 cursor-pointer ${
              filterStatus === status
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Summaries Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate text-sm">Loading clinical summaries...</div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-slate/40" />}
          title="No clinical summaries found"
          description={
            sessions.length === 0
              ? 'No consultation summaries recorded yet. Conduct voice consultations to generate AI clinical notes.'
              : `No summaries matching status "${filterStatus}".`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredSessions.map(session => {
            const patientNameParts = patient ? [patient.firstName, patient.lastName].filter(Boolean) : []
            const patientName = patientNameParts.length > 0 ? patientNameParts.join(' ').trim() : (patient?.name || patient?.email || `Patient #${session.patientId.slice(-6)}`)
            const formattedDate = session.startedAt
              ? new Date(session.startedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent Session'

            return (
              <Card
                key={session.id}
                className="flex flex-col justify-between hover:border-hi-yellow/60 transition-colors"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-serif">{patientName}</CardTitle>
                        <p className="text-xs text-slate mt-0.5">Clinical Consultation</p>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'success' : 'secondary'}>
                        {session.status === 'completed' ? 'Completed' : 'Active'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formattedDate}</span>
                    </div>

                    {session.soapNote ? (
                      <div className="space-y-2">
                        {session.soapNote.assessment && (
                          <div>
                            <p className="text-[11px] font-semibold text-deep-ink uppercase tracking-wider mb-1">
                              Assessment
                            </p>
                            <p className="text-xs text-slate line-clamp-2 leading-relaxed">
                              {session.soapNote.assessment}
                            </p>
                          </div>
                        )}
                        {session.soapNote.plan && (
                          <div>
                            <p className="text-[11px] font-semibold text-deep-ink uppercase tracking-wider mb-1">
                              Plan
                            </p>
                            <p className="text-xs text-slate line-clamp-2 leading-relaxed">
                              {session.soapNote.plan}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate italic">
                        {session.transcript ? 'Transcript recorded; SOAP note pending completion.' : 'Session recorded.'}
                      </p>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="pt-2">
                  <Link href={`/dashboard/doctor/summaries/${session.id}`} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-deep-ink/15 text-deep-ink hover:bg-hi-yellow hover:border-hi-yellow font-medium transition-all group justify-between px-5 cursor-pointer"
                    >
                      <span>View Summary & Note</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
