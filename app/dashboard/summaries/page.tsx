'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Clinical Summaries</h1>
          <p className="text-slate">Review and manage consultation summaries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {(['all', 'draft', 'published'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filterStatus === status
                ? 'bg-hi-yellow text-deep-ink'
                : 'bg-soft-meadow text-deep-ink hover:bg-soft-meadow/80'
            }`}
          >
            {status === 'all'
              ? 'All'
              : status === 'draft'
                ? 'Draft'
                : 'Published'}
          </button>
        ))}
      </div>

      {/* Summaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSummaries.map(summary => (
          <div key={summary.id} className="bg-white rounded-3xl p-6 border border-deep-ink/10 hover:border-hi-yellow/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold font-serif text-deep-ink">{summary.patientName}</h3>
                <p className="text-sm text-slate">{summary.type}</p>
              </div>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  summary.status === 'published'
                    ? 'bg-moss-green/20 text-deep-ink'
                    : 'bg-slate/10 text-slate'
                }`}
              >
                {summary.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            <p className="text-xs text-slate mb-4">{summary.date}</p>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-medium text-slate mb-2">Key Findings</p>
                <ul className="space-y-1">
                  {summary.keyFindings.map((finding, idx) => (
                    <li key={idx} className="text-xs text-slate flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-hi-yellow rounded-full" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href={`/dashboard/summaries/${summary.id}`}>
              <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                View Summary
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSummaries.length === 0 && (
        <div className="bg-soft-meadow/50 rounded-3xl p-12 text-center">
          <p className="text-slate mb-4">No {filterStatus === 'all' ? '' : filterStatus} summaries found.</p>
        </div>
      )}
    </div>
  )
}
