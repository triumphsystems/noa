'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  CalendarDays,
  Stethoscope,
  ShieldCheck,
  Plus,
  RefreshCw,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  LogOut,
  UserCheck,
  Building2,
  Mail,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react'
import { usePatientStore } from '@/lib/stores/patient.store'
import { WelcomeBanner } from '@/components/patient/welcome-banner'
import { PatientStatsGrid } from '@/components/patient/patient-stats-grid'
import { ConsultationsList } from '@/components/patient/consultations-list'
import { HealthInfoCard } from '@/components/patient/health-info-card'
import { PrivacyNoticeCard } from '@/components/patient/privacy-notice-card'
import { DoctorConnectCard } from '@/components/patient/doctor-connect-card'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorAlert } from '@/components/ui/error-alert'
import { cn } from '@/lib/utils'

export type PatientScreenTab = 'home' | 'visits' | 'care-team' | 'records'

export default function PatientDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as PatientScreenTab) || 'home'

  const [activeTab, setActiveTab] = useState<PatientScreenTab>(
    ['home', 'visits', 'care-team', 'records'].includes(initialTab) ? initialTab : 'home'
  )
  const [copiedCode, setCopiedCode] = useState(false)
  const [isChangingDoctor, setIsChangingDoctor] = useState(false)
  const [visitFilter, setVisitFilter] = useState<'all' | 'completed' | 'active'>('all')
  const [, startTransition] = useTransition()

  const {
    patientId,
    patient,
    doctor,
    pendingDoctor,
    sessions,
    intake,
    stats,
    isLoading,
    error,
    setPatientId,
    loadDashboard,
  } = usePatientStore()

  // Sync tab with URL search parameter if user deep-links or uses back button
  useEffect(() => {
    const tabParam = searchParams.get('tab') as PatientScreenTab
    if (tabParam && ['home', 'visits', 'care-team', 'records'].includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleTabChange = (newTab: string) => {
    const tab = newTab as PatientScreenTab
    setActiveTab(tab)
    startTransition(() => {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    })
    // Scroll smoothly to top on tab switch like a native app
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    let resolvedId = patientId
    if (!resolvedId && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('patientId')
      if (stored) {
        resolvedId = stored
        setPatientId(stored)
      }
    }

    if (resolvedId && !patient) {
      void loadDashboard(resolvedId)
    }
  }, [patientId, patient, setPatientId, loadDashboard])

  const handleRefresh = async () => {
    if (patientId) {
      await loadDashboard(patientId)
    }
  }

  const handleCopy = (text: string) => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.clear()
      }
      router.push('/auth/login')
    }
  }

  const fullName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : ''
  const hasDoctor = Boolean(patient?.doctorId && doctor)
  const isPendingApproval = patient?.linkStatus === 'pending_patient_approval'

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const filteredSessions = sessions.filter(session => {
    if (visitFilter === 'completed') return session.status === 'completed'
    if (visitFilter === 'active') return session.status !== 'completed'
    return true
  })

  // Skeleton loading state
  if (isLoading && !patient) {
    return (
      <div className="min-h-screen bg-[#f9fbf2] pb-24">
        {/* App bar skeleton */}
        <div className="bg-white/80 backdrop-blur-md border-b border-deep-ink/5 p-4 max-w-xl mx-auto flex items-center justify-between">
          <div className="h-6 w-28 bg-deep-ink/10 rounded-full animate-pulse" />
          <div className="w-9 h-9 bg-deep-ink/10 rounded-full animate-pulse" />
        </div>
        <div className="p-4 max-w-xl mx-auto space-y-4 pt-4 animate-pulse">
          <div className="h-32 bg-white rounded-2xl shadow-2xs border border-deep-ink/5" />
          <div className="grid grid-cols-3 gap-2.5">
            <div className="h-20 bg-white rounded-xl shadow-2xs border border-deep-ink/5" />
            <div className="h-20 bg-white rounded-xl shadow-2xs border border-deep-ink/5" />
            <div className="h-20 bg-white rounded-xl shadow-2xs border border-deep-ink/5" />
          </div>
          <div className="h-44 bg-white rounded-2xl shadow-2xs border border-deep-ink/5" />
          <div className="h-36 bg-white rounded-2xl shadow-2xs border border-deep-ink/5" />
        </div>
      </div>
    )
  }

  // Error state
  if (error && !patient) {
    return (
      <div className="min-h-screen bg-[#f9fbf2] p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-4">
          <ErrorAlert
            variant="card"
            title="Unable to Load Health Portal"
            message={error}
          />
          <div className="text-center">
            <Button
              variant="outline"
              className="rounded-full text-xs font-semibold px-6"
              onClick={() => patientId && void loadDashboard(patientId)}
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fbf2] text-deep-ink font-sans antialiased pb-28 select-none-headers">
      {/* ============================================================ */}
      {/* Top Mobile-Native App Bar                                    */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-deep-ink/5 px-4 py-3 transition-shadow">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand Identity & Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-hi-yellow/30 border border-hi-yellow/60 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-deep-ink" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-deep-ink text-sm tracking-tight">Noa</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-soft-meadow text-deep-ink rounded-full border border-deep-ink/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Health
                </span>
              </div>
              <p className="text-[11px] text-slate truncate">
                {getGreeting()}, <span className="font-semibold text-deep-ink">{patient?.firstName || 'Patient'}</span>
              </p>
            </div>
          </div>

          {/* Right: Quick Actions (Refresh & New Intake) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Dashboard"
              aria-label="Refresh Dashboard"
              className="w-8 h-8 rounded-full border border-deep-ink/10 bg-white hover:bg-soft-meadow flex items-center justify-center text-slate hover:text-deep-ink transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-deep-ink')} />
            </button>

            <Link href="/intake">
              <Button
                size="sm"
                className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-semibold text-xs px-3 py-1.5 h-8 gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">New Intake</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* Active Screen Content Container                              */}
      {/* ============================================================ */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* ============================================================ */}
        {/* SCREEN 1: HOME / OVERVIEW                                    */}
        {/* ============================================================ */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Pending Doctor Invitation Card - Priority Banner */}
            {isPendingApproval && pendingDoctor && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 shadow-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Doctor Invitation
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    </div>
                    <h4 className="text-sm font-bold text-deep-ink mt-0.5">
                      Dr. {pendingDoctor.name} invited you
                    </h4>
                    <p className="text-xs text-slate mt-0.5 leading-relaxed">
                      Accept to share your AI intake summaries and consultation notes with your clinician.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('care-team')}
                    className="flex-1 rounded-xl bg-deep-ink text-white hover:bg-deep-ink/90 font-semibold text-xs h-8 shadow-xs"
                  >
                    Review Invitation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('care-team')}
                    className="rounded-xl border-amber-300 text-slate hover:text-deep-ink text-xs h-8"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )}

            {/* Welcome Banner Card */}
            <WelcomeBanner
              name={fullName}
              hasDoctor={hasDoctor}
              doctorName={doctor?.name}
            />

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setActiveTab('visits')}
                className="p-3 bg-white rounded-2xl border border-deep-ink/10 shadow-2xs text-left hover:border-deep-ink/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Visits</span>
                  <CalendarDays className="w-3.5 h-3.5 text-slate group-hover:text-deep-ink transition-colors" />
                </div>
                <div className="text-2xl font-bold font-serif text-deep-ink mt-1.5">
                  {stats?.totalConsultations ?? sessions.length}
                </div>
                <span className="text-[10px] text-slate block truncate">Recorded visits</span>
              </button>

              <button
                onClick={() => setActiveTab('visits')}
                className="p-3 bg-white rounded-2xl border border-deep-ink/10 shadow-2xs text-left hover:border-deep-ink/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Status</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-serif text-emerald-700 mt-1.5">
                  {stats?.completedConsultations ?? sessions.filter(s => s.status === 'completed').length}
                </div>
                <span className="text-[10px] text-slate block truncate">Completed visits</span>
              </button>

              <button
                onClick={() => setActiveTab('records')}
                className="p-3 bg-white rounded-2xl border border-deep-ink/10 shadow-2xs text-left hover:border-deep-ink/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Intake</span>
                  <Activity className="w-3.5 h-3.5 text-slate group-hover:text-deep-ink transition-colors" />
                </div>
                <div className="text-sm font-bold font-serif text-deep-ink mt-2 truncate">
                  {stats?.hasIntake || intake ? 'Active' : 'Pending'}
                </div>
                <span className="text-[10px] text-slate block truncate">Health profile</span>
              </button>
            </div>

            {/* Care Team Glance Card */}
            <div className="bg-white p-4 rounded-2xl border border-deep-ink/10 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-deep-ink" />
                  <h3 className="font-serif font-bold text-sm text-deep-ink">Your Physician</h3>
                </div>
                <button
                  onClick={() => setActiveTab('care-team')}
                  className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {hasDoctor ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-soft-meadow/50 border border-deep-ink/5">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-deep-ink truncate">Dr. {doctor?.name}</p>
                    <p className="text-xs text-slate truncate">
                      {doctor?.specialty || 'General Practice'} • {doctor?.clinic || 'Clinical Center'}
                    </p>
                  </div>
                  <Badge variant="success" className="text-[10px] shrink-0">
                    Linked
                  </Badge>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-xs text-amber-900">No Doctor Linked</p>
                    <p className="text-[11px] text-slate">Connect with your physician using their Care Code.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('care-team')}
                    className="rounded-xl bg-deep-ink text-canvas hover:bg-deep-ink/90 text-xs px-3 h-7 shrink-0"
                  >
                    Connect
                  </Button>
                </div>
              )}
            </div>

            {/* Recent Visit Preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-serif font-bold text-sm text-deep-ink">Recent Visit Summary</h3>
                {sessions.length > 0 && (
                  <button
                    onClick={() => setActiveTab('visits')}
                    className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View all ({sessions.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <Card className="p-6 text-center border-dashed rounded-2xl bg-white/70">
                  <Clock className="w-8 h-8 text-slate/40 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate">No consultation visits recorded yet.</p>
                  <p className="text-[11px] text-slate/70 mt-1 mb-3">
                    Your summaries and AI care plans will appear here after consultations.
                  </p>
                  <Link href="/intake">
                    <Button variant="outline" className="rounded-full text-xs font-semibold px-4 h-8">
                      Start First Intake
                    </Button>
                  </Link>
                </Card>
              ) : (
                (() => {
                  const recent = sessions[0]
                  const dateStr = recent.startedAt
                    ? new Date(recent.startedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent'
                  const summarySnippet =
                    recent.soapNote?.assessment ||
                    recent.soapNote?.plan ||
                    recent.transcript?.slice(0, 120) ||
                    'Clinical consultation recorded.'

                  return (
                    <Card className="p-4 rounded-2xl bg-white border border-deep-ink/10 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-slate flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate/60" />
                            {dateStr}
                          </span>
                          <h4 className="font-serif font-bold text-base text-deep-ink mt-0.5">
                            Consultation Summary
                          </h4>
                        </div>
                        <Badge variant={recent.status === 'completed' ? 'success' : 'default'} className="text-[10px]">
                          {recent.status === 'completed' ? 'Completed' : 'Active'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate line-clamp-2 leading-relaxed bg-soft-meadow/40 p-2.5 rounded-xl border border-deep-ink/5">
                        {summarySnippet}
                      </p>

                      <Link href={`/dashboard/patient/consultations/${recent.id}`} className="block">
                        <Button className="w-full rounded-xl bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-semibold text-xs h-9 gap-1.5 shadow-2xs cursor-pointer">
                          <span>View Full Clinical Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </Card>
                  )
                })()
              )}
            </div>

            {/* Quick Link to Records Snapshot */}
            <div
              onClick={() => setActiveTab('records')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-2xl bg-white border border-deep-ink/10 shadow-2xs flex items-center justify-between cursor-pointer hover:border-deep-ink/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-soft-meadow flex items-center justify-center text-deep-ink">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-deep-ink">Medical Information & Medications</h4>
                  <p className="text-[11px] text-slate">
                    {intake?.medications?.length || patient?.medications?.length || 0} meds •{' '}
                    {intake?.allergies?.length || patient?.allergies?.length || 0} allergies documented
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate" />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 2: VISITS / CONSULTATIONS                             */}
        {/* ============================================================ */}
        {activeTab === 'visits' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Screen Header */}
            <div className="bg-white p-4 rounded-2xl border border-deep-ink/10 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-lg text-deep-ink">Your Consultations</h2>
                  <p className="text-xs text-slate">
                    Summaries, assessment findings, and treatment plans from your clinical visits.
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                  {sessions.length} total
                </Badge>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-1.5 p-1 bg-soft-meadow/60 rounded-xl border border-deep-ink/5">
                {(
                  [
                    { id: 'all', label: 'All Visits' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'active', label: 'In Progress' },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setVisitFilter(tab.id)}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center',
                      visitFilter === tab.id
                        ? 'bg-white text-deep-ink shadow-2xs'
                        : 'text-slate hover:text-deep-ink'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consultations List */}
            {filteredSessions.length === 0 ? (
              <Card className="p-8 text-center border-dashed rounded-2xl bg-white space-y-3">
                <Clock className="w-10 h-10 text-slate/30 mx-auto" />
                <h4 className="font-serif font-bold text-deep-ink text-base">No visits found</h4>
                <p className="text-xs text-slate max-w-xs mx-auto">
                  {visitFilter !== 'all'
                    ? `You don't have any visits with status "${visitFilter}".`
                    : 'You haven’t completed any clinical consultations yet.'}
                </p>
                <div className="pt-2">
                  <Link href="/intake">
                    <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-semibold px-5 shadow-2xs">
                      Start Health Intake
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map(session => {
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
                    <Card
                      key={session.id}
                      className="p-4 rounded-2xl bg-white border border-deep-ink/10 shadow-2xs hover:border-deep-ink/30 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold font-serif text-deep-ink text-base">
                              Consultation {doctor?.name ? `with Dr. ${doctor.name}` : ''}
                            </h4>
                            <Badge variant={session.status === 'completed' ? 'success' : 'default'} className="text-[10px]">
                              {session.status === 'completed' ? 'Completed' : 'Active'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate/60" />
                              {dateStr}
                            </span>
                            {doctor?.specialty && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3 text-slate/60" />
                                {doctor.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-soft-meadow/40 p-3 rounded-xl border border-deep-ink/5">
                        <p className="text-xs text-deep-ink/90 leading-relaxed line-clamp-3">
                          {summary}
                        </p>
                      </div>

                      <Link href={`/dashboard/patient/consultations/${session.id}`} className="block">
                        <Button className="w-full rounded-xl bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-semibold text-xs h-9 gap-1.5 shadow-2xs cursor-pointer">
                          <span>View Full Clinical Summary & Care Plan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 3: CARE TEAM / DOCTOR CONNECTION                      */}
        {/* ============================================================ */}
        {activeTab === 'care-team' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Connected Doctor Dossier View */}
            {hasDoctor && !isChangingDoctor && (
              <div className="space-y-4">
                <Card className="p-5 rounded-2xl bg-white border border-deep-ink/10 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold font-serif text-lg shrink-0 border border-teal-200">
                        {doctor?.name ? doctor.name.slice(0, 2).toUpperCase() : 'DR'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-lg text-deep-ink">
                            Dr. {doctor?.name}
                          </h3>
                          <Badge variant="success" className="text-[10px]">
                            Connected
                          </Badge>
                        </div>
                        <p className="text-xs text-slate font-medium">
                          {doctor?.specialty || 'General Practice'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor practice info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-soft-meadow/50 border border-deep-ink/5 text-xs">
                    <div>
                      <span className="text-slate text-[11px] block">Clinic / Hospital</span>
                      <span className="font-semibold text-deep-ink truncate block">
                        {doctor?.clinic || 'Independent Practice'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate text-[11px] block">Care Code</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-deep-ink bg-white px-2 py-0.5 rounded border border-deep-ink/10">
                          {doctor?.careCode || 'NOA-CARE'}
                        </span>
                        <button
                          onClick={() => handleCopy(doctor?.careCode || '')}
                          className="text-slate hover:text-deep-ink p-1 cursor-pointer"
                          title="Copy Care Code"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {doctor?.email && (
                      <div className="sm:col-span-2 flex items-center gap-1.5 text-slate pt-1 border-t border-deep-ink/5">
                        <Mail className="w-3.5 h-3.5 text-slate/70" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Link Benefit Notice */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Dr. {doctor?.name} has authorized access to review your AI intake submissions, session transcripts, and SOAP clinical care plans.
                    </p>
                  </div>

                  {/* Switch / Change Doctor button */}
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingDoctor(true)}
                      className="w-full rounded-xl text-xs text-slate hover:text-deep-ink border-deep-ink/15 font-semibold h-9"
                    >
                      Connect with Different Doctor
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Doctor Connect Card (When not connected, pending, or changing doctor) */}
            {(!hasDoctor || isChangingDoctor || isPendingApproval) && (
              <div className="space-y-3">
                {isChangingDoctor && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate">Connect with new healthcare provider</span>
                    <button
                      onClick={() => setIsChangingDoctor(false)}
                      className="text-xs font-semibold text-deep-ink hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <DoctorConnectCard
                  pendingDoctor={pendingDoctor}
                  linkStatus={patient?.linkStatus}
                  onRefresh={async () => {
                    if (patientId) await loadDashboard(patientId)
                    setIsChangingDoctor(false)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 4: HEALTH RECORDS & SECURITY                          */}
        {/* ============================================================ */}
        {activeTab === 'records' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Screen Header */}
            <div className="bg-white p-4 rounded-2xl border border-deep-ink/10 shadow-2xs flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-deep-ink">Health Records</h2>
                <p className="text-xs text-slate">Your verified medical baseline and security rights.</p>
              </div>
              <Link href="/intake">
                <Button size="sm" className="rounded-full bg-hi-yellow text-deep-ink font-semibold text-xs h-8">
                  Update Intake
                </Button>
              </Link>
            </div>

            {/* Health Info Card (Meds & Allergies) */}
            <HealthInfoCard patient={patient} intake={intake} />

            {/* Intake Profile Card */}
            <Card className="p-5 rounded-2xl bg-white border border-deep-ink/10 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-soft-meadow flex items-center justify-center text-deep-ink">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-deep-ink">Clinical Intake Status</h3>
                    <p className="text-[11px] text-slate">
                      {intake?.updatedAt
                        ? `Last updated on ${new Date(intake.updatedAt).toLocaleDateString()}`
                        : 'Preliminary baseline intake recorded'}
                    </p>
                  </div>
                </div>
                <Badge variant={intake ? 'success' : 'default'} className="text-[10px]">
                  {intake ? 'Completed' : 'Pending'}
                </Badge>
              </div>

              {intake?.chiefComplaint && (
                <div className="p-3 rounded-xl bg-soft-meadow/50 border border-deep-ink/5 text-xs text-deep-ink space-y-1">
                  <span className="font-semibold text-slate block text-[11px]">Primary Chief Complaint:</span>
                  <p className="leading-relaxed">{intake.chiefComplaint}</p>
                </div>
              )}
            </Card>

            {/* End to End Privacy Notice */}
            <PrivacyNoticeCard />

            {/* Sign Out Card */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold text-xs h-10 gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Patient Portal</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* Bottom Navigation Dock (Reusable Role-Aware BottomNav)       */}
      {/* ============================================================ */}
      <BottomNav
        role="patient"
        activeTab={activeTab}
        onTabChange={handleTabChange}
        badgeCounts={{
          visits: sessions.length > 0 ? sessions.length : undefined,
          'care-team': isPendingApproval ? '1' : undefined,
        }}
        floatingDockOnDesktop={true}
      />
    </div>
  )
}
