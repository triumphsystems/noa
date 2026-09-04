import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, UserCheck } from 'lucide-react'
import type { Session, Doctor } from '@/lib/db'

interface ConsultationsListProps {
  sessions: Session[]
  doctor: Doctor | null
}

export function ConsultationsList({ sessions, doctor }: ConsultationsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold font-serif text-deep-ink">Your Consultations</h3>
        <span className="text-xs text-slate">{sessions.length} recorded</span>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate mb-3">No consultations recorded yet.</p>
          <Link href="/intake">
            <Button variant="outline" className="rounded-full text-xs">
              Complete Initial Intake
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const dateStr = session.startedAt
              ? new Date(session.startedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent'
            const summary =
              session.soapNote?.assessment ||
              session.soapNote?.plan ||
              (session.transcript ? `${session.transcript.slice(0, 140)}...` : 'Clinical encounter recorded.')

            return (
              <Card key={session.id} className="hover:border-hi-yellow/60 transition-colors p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h4 className="font-semibold font-serif text-deep-ink text-base sm:text-lg">
                        Consultation {doctor?.name ? `with ${doctor.name}` : ''}
                      </h4>
                      <Badge variant={session.status === 'completed' ? 'success' : 'default'}>
                        {session.status === 'completed' ? 'Completed' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate leading-relaxed line-clamp-2">{summary}</p>
                    <div className="flex items-center gap-4 text-xs text-slate pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {dateStr}
                      </span>
                      {doctor?.specialty && (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 shrink-0" />
                          {doctor.specialty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0">
                    <Link href={`/dashboard/patient/consultations/${session.id}`} className="block sm:inline">
                      <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium text-xs sm:text-sm">
                        View Summary
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
