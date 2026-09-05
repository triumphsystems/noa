'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { usePatientStore } from '@/lib/stores/patient.store';
import { WelcomeBanner } from '@/components/patient/welcome-banner';
import { PatientStatsGrid } from '@/components/patient/patient-stats-grid';
import { ConsultationsList } from '@/components/patient/consultations-list';
import { HealthInfoCard } from '@/components/patient/health-info-card';
import { PrivacyNoticeCard } from '@/components/patient/privacy-notice-card';
import { DoctorConnectCard } from '@/components/patient/doctor-connect-card';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorAlert } from '@/components/ui/error-alert';
import { cn } from '@/lib/utils';

export type PatientScreenTab = 'home' | 'visits' | 'care-team' | 'records';

export default function PatientDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as PatientScreenTab) || 'home';

  const [activeTab, setActiveTab] = useState<PatientScreenTab>(
    ['home', 'visits', 'care-team', 'records'].includes(initialTab)
      ? initialTab
      : 'home'
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [isChangingDoctor, setIsChangingDoctor] = useState(false);
  const [visitFilter, setVisitFilter] = useState<
    'all' | 'completed' | 'active'
  >('all');
  const [, startTransition] = useTransition();

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
  } = usePatientStore();

  // Sync tab with URL search parameter if user deep-links or uses back button
  useEffect(() => {
    const tabParam = searchParams.get('tab') as PatientScreenTab;
    if (
      tabParam &&
      ['home', 'visits', 'care-team', 'records'].includes(tabParam) &&
      tabParam !== activeTab
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    const tab = newTab as PatientScreenTab;
    setActiveTab(tab);
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    });
    // Scroll smoothly to top on tab switch like a native app
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let resolvedId = patientId;
    if (!resolvedId && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('patientId');
      if (stored) {
        resolvedId = stored;
        setPatientId(stored);
      }
    }

    if (resolvedId && !patient) {
      void loadDashboard(resolvedId);
    }
  }, [patientId, patient, setPatientId, loadDashboard]);

  const handleRefresh = async () => {
    if (patientId) {
      await loadDashboard(patientId);
    }
  };

  const handleCopy = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
      router.push('/auth/login');
    }
  };

  const fullName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : '';
  const hasDoctor = Boolean(patient?.doctorId && doctor);
  const isPendingApproval = patient?.linkStatus === 'pending_patient_approval';

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredSessions = sessions.filter((session) => {
    if (visitFilter === 'completed') return session.status === 'completed';
    if (visitFilter === 'active') return session.status !== 'completed';
    return true;
  });

  // Skeleton loading state
  if (isLoading && !patient) {
    return (
      <div className="min-h-screen bg-[#f9fbf2] pb-24">
        {/* App bar skeleton */}
        <div className="border-deep-ink/5 flex w-full items-center justify-between border-b bg-white/80 p-4 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="bg-deep-ink/10 h-6 w-28 animate-pulse rounded-full" />
          <div className="bg-deep-ink/10 h-9 w-9 animate-pulse rounded-full" />
        </div>
        <div className="w-full animate-pulse space-y-4 p-4 pt-4 sm:p-6 lg:p-8">
          <div className="border-deep-ink/5 h-32 rounded-2xl border bg-white shadow-2xs" />
          <div className="grid grid-cols-3 gap-2.5">
            <div className="border-deep-ink/5 h-20 rounded-xl border bg-white shadow-2xs" />
            <div className="border-deep-ink/5 h-20 rounded-xl border bg-white shadow-2xs" />
            <div className="border-deep-ink/5 h-20 rounded-xl border bg-white shadow-2xs" />
          </div>
          <div className="border-deep-ink/5 h-44 rounded-2xl border bg-white shadow-2xs" />
          <div className="border-deep-ink/5 h-36 rounded-2xl border bg-white shadow-2xs" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fbf2] p-4">
        <div className="w-full max-w-md space-y-4">
          <ErrorAlert
            variant="card"
            title="Unable to Load Health Portal"
            message={error}
          />
          <div className="text-center">
            <Button
              variant="outline"
              className="rounded-full px-6 text-xs font-semibold"
              onClick={() => patientId && void loadDashboard(patientId)}
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-deep-ink select-none-headers min-h-screen bg-[#f9fbf2] pb-28 font-sans antialiased">
      {/* ============================================================ */}
      {/* Active Screen Content Container (Full width on desktop)      */}
      {/* ============================================================ */}
      <main className="w-full space-y-5 px-4 pt-4 sm:px-6 sm:pt-6 lg:space-y-6 lg:px-8">
        {/* Top Page Action & Greeting Bar (Single clean header) */}
        <div className="flex flex-col justify-between gap-4 pb-1 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="bg-hi-yellow/30 border-hi-yellow/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-2xs">
              <Sparkles className="text-deep-ink h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-deep-ink font-serif text-xl font-bold sm:text-2xl">
                  {getGreeting()},{' '}
                  <span className="text-deep-ink">
                    {patient?.firstName || 'Patient'}
                  </span>
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Active Portal
                </span>
              </div>
              <p className="text-slate text-xs">
                Your encrypted personal AI health records and consultation
                summaries
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Dashboard"
              aria-label="Refresh Dashboard"
              className="border-deep-ink/10 hover:bg-soft-meadow text-slate hover:text-deep-ink flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs shadow-2xs transition-colors"
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5',
                  isLoading && 'text-deep-ink animate-spin'
                )}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link href="/intake">
              <Button
                size="sm"
                className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 cursor-pointer gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Intake</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Desktop Top Navigation Tabs (Hidden on mobile where bottom nav is active) */}
        <div className="border-deep-ink/8 hidden items-center gap-1.5 rounded-2xl border bg-white/80 p-1.5 shadow-2xs backdrop-blur-md sm:flex">
          {[
            { id: 'home', label: 'Overview', icon: Home },
            {
              id: 'visits',
              label: 'Consultations',
              icon: CalendarDays,
              badge: sessions.length || null,
            },
            {
              id: 'care-team',
              label: 'Care Team',
              icon: Stethoscope,
              badge: isPendingApproval ? '1' : null,
            },
            { id: 'records', label: 'Health Records', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-deep-ink text-canvas shadow-xs'
                    : 'text-slate hover:text-deep-ink hover:bg-soft-meadow/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
                      isActive
                        ? 'bg-hi-yellow text-deep-ink'
                        : 'bg-amber-100 text-amber-900'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* SCREEN 1: HOME / OVERVIEW                                    */}
        {/* ============================================================ */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in space-y-5 duration-200">
            {/* Pending Doctor Invitation Card - Priority Banner */}
            {isPendingApproval && pendingDoctor && (
              <div className="space-y-3 rounded-2xl border border-amber-300/80 bg-amber-50/90 p-4 shadow-xs sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-wider text-amber-900 uppercase">
                        Doctor Invitation
                      </span>
                      <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
                    </div>
                    <h4 className="text-deep-ink mt-0.5 text-sm font-bold sm:text-base">
                      Dr. {pendingDoctor.name} invited you to connect
                    </h4>
                    <p className="text-slate mt-0.5 text-xs leading-relaxed">
                      Accept to share your AI intake summaries and consultation
                      notes with your clinician.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 sm:max-w-xs">
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('care-team')}
                    className="bg-deep-ink hover:bg-deep-ink/90 h-8 flex-1 cursor-pointer rounded-xl text-xs font-semibold text-white shadow-xs"
                  >
                    Review Invitation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('care-team')}
                    className="text-slate hover:text-deep-ink h-8 cursor-pointer rounded-xl border-amber-300 text-xs"
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

            {/* Desktop 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
              {/* Left Column (2 cols): Metrics & Consultation History */}
              <div className="space-y-5 lg:col-span-2">
                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                  <button
                    onClick={() => setActiveTab('visits')}
                    className="border-deep-ink/10 hover:border-deep-ink/30 group cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-2xs transition-all sm:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                        Visits
                      </span>
                      <CalendarDays className="text-slate group-hover:text-deep-ink h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4" />
                    </div>
                    <div className="text-deep-ink mt-1.5 font-serif text-2xl font-bold sm:text-3xl">
                      {stats?.totalConsultations ?? sessions.length}
                    </div>
                    <span className="text-slate block truncate text-[10px] sm:text-xs">
                      Recorded visits
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('visits')}
                    className="border-deep-ink/10 hover:border-deep-ink/30 group cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-2xs transition-all sm:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                        Status
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
                    </div>
                    <div className="mt-1.5 font-serif text-2xl font-bold text-emerald-700 sm:text-3xl">
                      {stats?.completedConsultations ??
                        sessions.filter((s) => s.status === 'completed').length}
                    </div>
                    <span className="text-slate block truncate text-[10px] sm:text-xs">
                      Completed visits
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('records')}
                    className="border-deep-ink/10 hover:border-deep-ink/30 group cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-2xs transition-all sm:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                        Intake
                      </span>
                      <Activity className="text-slate group-hover:text-deep-ink h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4" />
                    </div>
                    <div className="text-deep-ink mt-2 truncate font-serif text-base font-bold sm:text-lg">
                      {stats?.hasIntake || intake ? 'Active' : 'Pending'}
                    </div>
                    <span className="text-slate block truncate text-[10px] sm:text-xs">
                      Health profile
                    </span>
                  </button>
                </div>

                {/* Recent Visit Preview */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-deep-ink font-serif text-sm font-bold sm:text-base">
                      Recent Visit Summary
                    </h3>
                    {sessions.length > 0 && (
                      <button
                        onClick={() => setActiveTab('visits')}
                        className="text-slate hover:text-deep-ink flex cursor-pointer items-center gap-0.5 text-xs font-semibold"
                      >
                        <span>View all ({sessions.length})</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <Card className="rounded-2xl border-dashed bg-white/70 p-6 text-center sm:p-8">
                      <Clock className="text-slate/40 mx-auto mb-2 h-8 w-8" />
                      <p className="text-slate text-xs font-medium">
                        No consultation visits recorded yet.
                      </p>
                      <p className="text-slate/70 mt-1 mb-3 text-[11px]">
                        Your summaries and AI care plans will appear here after
                        consultations.
                      </p>
                      <Link href="/intake">
                        <Button
                          variant="outline"
                          className="h-8 cursor-pointer rounded-full px-4 text-xs font-semibold"
                        >
                          Start First Intake
                        </Button>
                      </Link>
                    </Card>
                  ) : (
                    (() => {
                      const recent = sessions[0];
                      const dateStr = recent.startedAt
                        ? new Date(recent.startedAt).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )
                        : 'Recent';
                      const summarySnippet =
                        recent.soapNote?.assessment ||
                        recent.soapNote?.plan ||
                        recent.transcript?.slice(0, 120) ||
                        'Clinical consultation recorded.';

                      return (
                        <Card className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs sm:p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-slate flex items-center gap-1 text-[11px] font-semibold">
                                <Calendar className="text-slate/60 h-3 w-3" />
                                {dateStr}
                              </span>
                              <h4 className="text-deep-ink mt-0.5 font-serif text-base font-bold">
                                Consultation Summary
                              </h4>
                            </div>
                            <Badge
                              variant={
                                recent.status === 'completed'
                                  ? 'success'
                                  : 'default'
                              }
                              className="text-[10px]"
                            >
                              {recent.status === 'completed'
                                ? 'Completed'
                                : 'Active'}
                            </Badge>
                          </div>

                          <p className="text-slate bg-soft-meadow/40 border-deep-ink/5 line-clamp-2 rounded-xl border p-3 text-xs leading-relaxed sm:text-sm">
                            {summarySnippet}
                          </p>

                          <Link
                            href={`/dashboard/patient/consultations/${recent.id}`}
                            className="block"
                          >
                            <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 w-full cursor-pointer gap-1.5 rounded-xl text-xs font-semibold shadow-2xs">
                              <span>View Full Clinical Report</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </Card>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Right Column (1 col): Care Team & Records Snapshot */}
              <div className="space-y-5">
                {/* Care Team Glance Card */}
                <div className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="text-deep-ink h-4 w-4" />
                      <h3 className="text-deep-ink font-serif text-sm font-bold">
                        Your Physician
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('care-team')}
                      className="text-slate hover:text-deep-ink flex cursor-pointer items-center gap-0.5 text-xs font-semibold"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {hasDoctor ? (
                    <div className="bg-soft-meadow/50 border-deep-ink/5 flex items-center justify-between rounded-xl border p-3">
                      <div className="min-w-0">
                        <p className="text-deep-ink truncate text-sm font-bold">
                          Dr. {doctor?.name}
                        </p>
                        <p className="text-slate truncate text-xs">
                          {doctor?.specialty || 'General Practice'} •{' '}
                          {doctor?.clinic || 'Clinical Center'}
                        </p>
                      </div>
                      <Badge variant="success" className="shrink-0 text-[10px]">
                        Linked
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3">
                      <div>
                        <p className="text-xs font-semibold text-amber-900">
                          No Doctor Linked
                        </p>
                        <p className="text-slate text-[11px]">
                          Connect with your physician using their Care Code.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('care-team')}
                        className="bg-deep-ink text-canvas hover:bg-deep-ink/90 h-7 shrink-0 cursor-pointer rounded-xl px-3 text-xs"
                      >
                        Connect
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Link to Records Snapshot */}
                <div
                  onClick={() => setActiveTab('records')}
                  role="button"
                  tabIndex={0}
                  className="border-deep-ink/10 hover:border-deep-ink/30 flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-4 shadow-2xs transition-all sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-soft-meadow text-deep-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-deep-ink text-xs font-bold">
                        Medical Information & Medications
                      </h4>
                      <p className="text-slate mt-0.5 text-[11px]">
                        {intake?.medications?.length ||
                          patient?.medications?.length ||
                          0}{' '}
                        meds •{' '}
                        {intake?.allergies?.length ||
                          patient?.allergies?.length ||
                          0}{' '}
                        allergies documented
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate h-4 w-4 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 2: VISITS / CONSULTATIONS                             */}
        {/* ============================================================ */}
        {activeTab === 'visits' && (
          <div className="animate-in fade-in space-y-4 duration-200">
            {/* Screen Header */}
            <div className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-deep-ink font-serif text-lg font-bold">
                    Your Consultations
                  </h2>
                  <p className="text-slate text-xs">
                    Summaries, assessment findings, and treatment plans from
                    your clinical visits.
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-xs font-semibold"
                >
                  {sessions.length} total
                </Badge>
              </div>

              {/* Status Filter Tabs */}
              <div className="bg-soft-meadow/60 border-deep-ink/5 flex gap-1.5 rounded-xl border p-1">
                {(
                  [
                    { id: 'all', label: 'All Visits' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'active', label: 'In Progress' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setVisitFilter(tab.id)}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg py-1.5 text-center text-xs font-semibold transition-all',
                      visitFilter === tab.id
                        ? 'text-deep-ink bg-white shadow-2xs'
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
              <Card className="space-y-3 rounded-2xl border-dashed bg-white p-8 text-center">
                <Clock className="text-slate/30 mx-auto h-10 w-10" />
                <h4 className="text-deep-ink font-serif text-base font-bold">
                  No visits found
                </h4>
                <p className="text-slate mx-auto max-w-xs text-xs">
                  {visitFilter !== 'all'
                    ? `You don't have any visits with status "${visitFilter}".`
                    : 'You haven’t completed any clinical consultations yet.'}
                </p>
                <div className="pt-2">
                  <Link href="/intake">
                    <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 rounded-full px-5 text-xs font-semibold shadow-2xs">
                      Start Health Intake
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const dateStr = session.startedAt
                    ? new Date(session.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';
                  const summary =
                    session.soapNote?.assessment ||
                    session.soapNote?.plan ||
                    (session.transcript
                      ? `${session.transcript.slice(0, 140)}...`
                      : 'Clinical encounter recorded.');

                  return (
                    <Card
                      key={session.id}
                      className="border-deep-ink/10 hover:border-deep-ink/30 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-deep-ink font-serif text-base font-semibold">
                              Consultation{' '}
                              {doctor?.name ? `with Dr. ${doctor.name}` : ''}
                            </h4>
                            <Badge
                              variant={
                                session.status === 'completed'
                                  ? 'success'
                                  : 'default'
                              }
                              className="text-[10px]"
                            >
                              {session.status === 'completed'
                                ? 'Completed'
                                : 'Active'}
                            </Badge>
                          </div>
                          <div className="text-slate mt-1 flex flex-wrap items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Calendar className="text-slate/60 h-3 w-3" />
                              {dateStr}
                            </span>
                            {doctor?.specialty && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="text-slate/60 h-3 w-3" />
                                {doctor.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3">
                        <p className="text-deep-ink/90 line-clamp-3 text-xs leading-relaxed">
                          {summary}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/patient/consultations/${session.id}`}
                        className="block"
                      >
                        <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 w-full cursor-pointer gap-1.5 rounded-xl text-xs font-semibold shadow-2xs">
                          <span>View Full Clinical Summary & Care Plan</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 3: CARE TEAM / DOCTOR CONNECTION                      */}
        {/* ============================================================ */}
        {activeTab === 'care-team' && (
          <div className="animate-in fade-in space-y-4 duration-200">
            {/* Connected Doctor Dossier View */}
            {hasDoctor && !isChangingDoctor && (
              <div className="space-y-4">
                <Card className="border-deep-ink/10 space-y-4 rounded-2xl border bg-white p-5 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-100 font-serif text-lg font-bold text-teal-800">
                        {doctor?.name
                          ? doctor.name.slice(0, 2).toUpperCase()
                          : 'DR'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-deep-ink font-serif text-lg font-bold">
                            Dr. {doctor?.name}
                          </h3>
                          <Badge variant="success" className="text-[10px]">
                            Connected
                          </Badge>
                        </div>
                        <p className="text-slate text-xs font-medium">
                          {doctor?.specialty || 'General Practice'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor practice info grid */}
                  <div className="bg-soft-meadow/50 border-deep-ink/5 grid grid-cols-1 gap-3 rounded-xl border p-3.5 text-xs sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
                    <div>
                      <span className="text-slate block text-[11px]">
                        Clinic / Hospital
                      </span>
                      <span className="text-deep-ink block truncate font-semibold">
                        {doctor?.clinic || 'Independent Practice'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate block text-[11px]">
                        Care Code
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-deep-ink border-deep-ink/10 rounded border bg-white px-2 py-0.5 font-mono font-bold">
                          {doctor?.careCode || 'NOA-CARE'}
                        </span>
                        <button
                          onClick={() => handleCopy(doctor?.careCode || '')}
                          className="text-slate hover:text-deep-ink cursor-pointer p-1"
                          title="Copy Care Code"
                        >
                          {copiedCode ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {doctor?.email && (
                      <div className="text-slate border-deep-ink/5 flex items-center gap-1.5 border-t pt-1 sm:col-span-2 sm:border-t-0 sm:pt-0 lg:col-span-1 lg:border-t-0">
                        <Mail className="text-slate/70 h-3.5 w-3.5" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Link Benefit Notice */}
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="leading-relaxed">
                      Dr. {doctor?.name} has authorized access to review your AI
                      intake submissions, session transcripts, and SOAP clinical
                      care plans.
                    </p>
                  </div>

                  {/* Switch / Change Doctor button */}
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingDoctor(true)}
                      className="text-slate hover:text-deep-ink border-deep-ink/15 h-9 w-full rounded-xl text-xs font-semibold"
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
                    <span className="text-slate text-xs">
                      Connect with new healthcare provider
                    </span>
                    <button
                      onClick={() => setIsChangingDoctor(false)}
                      className="text-deep-ink cursor-pointer text-xs font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <DoctorConnectCard
                  pendingDoctor={pendingDoctor}
                  linkStatus={patient?.linkStatus}
                  onRefresh={async () => {
                    if (patientId) await loadDashboard(patientId);
                    setIsChangingDoctor(false);
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
          <div className="animate-in fade-in space-y-4 duration-200">
            {/* Screen Header */}
            <div className="border-deep-ink/10 flex items-center justify-between rounded-2xl border bg-white p-4 shadow-2xs">
              <div>
                <h2 className="text-deep-ink font-serif text-lg font-bold">
                  Health Records
                </h2>
                <p className="text-slate text-xs">
                  Your verified medical baseline and security rights.
                </p>
              </div>
              <Link href="/intake">
                <Button
                  size="sm"
                  className="bg-hi-yellow text-deep-ink h-8 rounded-full text-xs font-semibold"
                >
                  Update Intake
                </Button>
              </Link>
            </div>

            {/* Health Info Card (Meds & Allergies) */}
            <HealthInfoCard patient={patient} intake={intake} />

            {/* Intake Profile Card */}
            <Card className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-soft-meadow text-deep-ink flex h-8 w-8 items-center justify-center rounded-lg">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-deep-ink font-serif text-sm font-bold">
                      Clinical Intake Status
                    </h3>
                    <p className="text-slate text-[11px]">
                      {intake?.updatedAt
                        ? `Last updated on ${new Date(intake.updatedAt).toLocaleDateString()}`
                        : 'Preliminary baseline intake recorded'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={intake ? 'success' : 'default'}
                  className="text-[10px]"
                >
                  {intake ? 'Completed' : 'Pending'}
                </Badge>
              </div>

              {intake?.chiefComplaint && (
                <div className="bg-soft-meadow/50 border-deep-ink/5 text-deep-ink space-y-1 rounded-xl border p-3 text-xs">
                  <span className="text-slate block text-[11px] font-semibold">
                    Primary Chief Complaint:
                  </span>
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
                className="h-10 w-full cursor-pointer gap-2 rounded-2xl border-rose-200 text-xs font-semibold text-rose-700 hover:border-rose-300 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out of Patient Portal</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* Bottom Navigation Dock (Mobile only; desktop uses top tabs)  */}
      {/* ============================================================ */}
      <div className="sm:hidden">
        <BottomNav
          role="patient"
          activeTab={activeTab}
          onTabChange={handleTabChange}
          badgeCounts={{
            visits: sessions.length > 0 ? sessions.length : undefined,
            'care-team': isPendingApproval ? '1' : undefined,
          }}
          floatingDockOnDesktop={false}
        />
      </div>
    </div>
  );
}
