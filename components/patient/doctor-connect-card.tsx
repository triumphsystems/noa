'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Stethoscope,
  Mail,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import type { Doctor } from '@/lib/db'

interface DoctorConnectCardProps {
  pendingDoctor?: Doctor | null
  linkStatus?: string
  onRefresh: () => Promise<void>
}

export function DoctorConnectCard({
  pendingDoctor,
  linkStatus,
  onRefresh,
}: DoctorConnectCardProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'directory'>('code')
  const [careCodeInput, setCareCodeInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Doctor[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle accepting or declining an invitation from a doctor
  const handleRespondInvitation = async (action: 'accept' | 'decline') => {
    setIsSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/patients/respond-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to respond to invitation')
      }
      setFeedback({ type: 'success', message: data.message })
      await onRefresh()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle direct connect with Care Code or Doctor Email
  const handleConnectByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!careCodeInput.trim()) return

    setIsSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/doctors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careCode: careCodeInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Doctor not found with this code')
      }
      setFeedback({ type: 'success', message: data.message || 'Connected successfully!' })
      setCareCodeInput('')
      await onRefresh()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Connection failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Search doctors directory
  const handleSearchDirectory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSearching(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/doctors/search?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Search failed')
      setSearchResults(data.data || [])
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Directory search failed' })
    } finally {
      setIsSearching(false)
    }
  }

  // Connect to doctor clicked in directory
  const handleConnectToDoctor = async (doctorId: string) => {
    setIsSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/doctors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Connection failed')
      setFeedback({ type: 'success', message: data.message || 'Connected successfully!' })
      await onRefresh()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Connection failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 border border-deep-ink/10 bg-white/95 backdrop-blur-sm shadow-xs rounded-2xl space-y-6">
      {/* 1. Pending Doctor Invitation Banner */}
      {linkStatus === 'pending_patient_approval' && pendingDoctor && (
        <div className="p-5 rounded-xl border border-hi-yellow/40 bg-hi-yellow/10 space-y-4 animate-in fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-hi-yellow/20 flex items-center justify-center shrink-0 text-deep-ink">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-deep-ink font-serif text-base">
                    Dr. {pendingDoctor.name} invited you to connect
                  </h4>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                    Invitation
                  </Badge>
                </div>
                <p className="text-xs text-slate mt-1">
                  Connecting allows Dr. {pendingDoctor.name} ({pendingDoctor.clinic || pendingDoctor.specialty}) to review your AI intake summaries and consultation notes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => handleRespondInvitation('accept')}
              disabled={isSubmitting}
              className="rounded-full bg-deep-ink text-canvas hover:bg-deep-ink/90 font-medium text-xs px-5 py-2 h-auto gap-1.5 shadow-2xs cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Accept & Connect
            </Button>
            <Button
              onClick={() => handleRespondInvitation('decline')}
              disabled={isSubmitting}
              variant="outline"
              className="rounded-full border-deep-ink/20 text-slate hover:text-deep-ink font-medium text-xs px-4 py-2 h-auto gap-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* 2. Main Header & Description */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-soft-meadow flex items-center justify-center text-deep-ink shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold font-serif text-deep-ink">
            Connect to Your Physician
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate">
          Link your portal with your healthcare provider to enable clinical review of your health records, AI intake sessions, and consultation notes.
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs: Care Code vs Directory */}
      <div className="flex border-b border-deep-ink/10 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('code')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'code'
              ? 'text-deep-ink border-b-2 border-deep-ink'
              : 'text-slate hover:text-deep-ink'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Enter Care Code / Doctor Email
        </button>
        <button
          onClick={() => {
            setActiveTab('directory')
            if (searchResults.length === 0) void handleSearchDirectory()
          }}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'directory'
              ? 'text-deep-ink border-b-2 border-deep-ink'
              : 'text-slate hover:text-deep-ink'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Browse Directory
        </button>
      </div>

      {/* Tab 1: Code / Email Input */}
      {activeTab === 'code' && (
        <form onSubmit={handleConnectByCode} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-deep-ink flex items-center gap-1.5">
              Doctor Care Code or Email
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={careCodeInput}
                onChange={e => setCareCodeInput(e.target.value)}
                placeholder="e.g. NOA-7492AB or doctor@clinic.com"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !careCodeInput.trim()}
                className="rounded-xl bg-deep-ink text-canvas hover:bg-deep-ink/90 text-xs px-5 font-medium shrink-0 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate">
            Ask your doctor or clinic for their 6-character Noa Care Code or registered clinical email.
          </p>
        </form>
      )}

      {/* Tab 2: Directory Search */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchDirectory} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name, specialty, or clinic..."
                className="pl-9"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              variant="outline"
              className="rounded-xl border-deep-ink/15 text-xs px-4 font-medium shrink-0 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </Button>
          </form>

          {/* Search Results List */}
          <div className="divide-y divide-deep-ink/5 max-h-64 overflow-y-auto pr-1">
            {isSearching ? (
              <div className="py-8 text-center text-xs text-slate">Searching provider directory...</div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate">
                No doctors found matching your query.
              </div>
            ) : (
              searchResults.map(doc => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-3 hover:bg-soft-meadow/20 px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm text-deep-ink truncate">
                        Dr. {doc.name}
                      </h4>
                      {doc.careCode && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {doc.careCode}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate mt-0.5">
                      {doc.specialty && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          {doc.specialty}
                        </span>
                      )}
                      {doc.clinic && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3" />
                          {doc.clinic}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConnectToDoctor(doc.id)}
                    disabled={isSubmitting}
                    className="rounded-full bg-deep-ink text-canvas hover:bg-deep-ink/90 text-xs px-3.5 py-1.5 h-auto font-medium shrink-0 cursor-pointer shadow-2xs"
                  >
                    Connect
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
