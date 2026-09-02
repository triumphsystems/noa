'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar, FileText, ArrowRight } from 'lucide-react'

interface ClinicalSummary {
  id: string
  patientName: string
  date: string
  type: string
  keyFindings: string[]
  recommendations: string[]
  status: 'draft' | 'published'
}

const mockSummaries: ClinicalSummary[] = [
  {
    id: '1',
    patientName: 'John Doe',
    date: 'March 20, 2026',
    type: 'Quarterly Review',
    keyFindings: ['Blood pressure well controlled', 'Glucose levels stable', 'Lipid panel improving'],
    recommendations: ['Continue current medications', 'Increase physical activity', 'Follow-up in 3 months'],
    status: 'published',
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    date: 'March 19, 2026',
    type: 'Initial Consultation',
    keyFindings: ['Migraine pattern identified', 'Tension-related triggers noted'],
    recommendations: ['Trial of preventive therapy', 'Lifestyle modifications', 'Daily headache diary'],
    status: 'published',
  },
  {
    id: '3',
    patientName: 'Robert Johnson',
    date: 'March 18, 2026',
    type: 'Medication Review',
    keyFindings: ['Current regimen effective', 'No adverse effects reported'],
    recommendations: ['Continue as prescribed', 'Monitor for side effects'],
    status: 'draft',
  },
]

export default function SummariesPage() {
  const [summaries] = useState(mockSummaries)
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all')

  const filteredSummaries =
    filterStatus === 'all' ? summaries : summaries.filter(s => s.status === filterStatus)

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif mb-1 text-deep-ink">Clinical Summaries</h1>
        <p className="text-slate text-sm">Review, verify, and export consultation summaries</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'draft', 'published'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
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
      {filteredSummaries.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-slate/40" />}
          title="No summaries found"
          description={`No consultation summaries matching status "${filterStatus}".`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSummaries.map(summary => (
            <Card
              key={summary.id}
              className="flex flex-col justify-between hover:border-hi-yellow/60 transition-colors"
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{summary.patientName}</CardTitle>
                      <p className="text-xs text-slate mt-0.5">{summary.type}</p>
                    </div>
                    <Badge variant={summary.status === 'published' ? 'success' : 'draft'}>
                      {summary.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{summary.date}</span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-deep-ink uppercase tracking-wider mb-2">
                      Key Findings
                    </p>
                    <ul className="space-y-1.5">
                      {summary.keyFindings.map((finding, idx) => (
                        <li key={idx} className="text-xs text-slate flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-hi-yellow rounded-full mt-1 shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-2">
                <Link href={`/dashboard/doctor/summaries/${summary.id}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-deep-ink/15 text-deep-ink hover:bg-hi-yellow hover:border-hi-yellow font-medium transition-all group justify-between px-5"
                  >
                    <span>View Summary</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
