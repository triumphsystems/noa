'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

import { useDoctorStore } from '@/lib/stores/doctor.store';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const doctor = useDoctorStore((state) => state.doctor);
  const patients = useDoctorStore((state) => state.patients);
  const sessions = useDoctorStore((state) => state.sessions);
  const stats = useDoctorStore((state) => state.stats);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const error = useDoctorStore((state) => state.error);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  const handleRefresh = () => {
    if (typeof window === 'undefined') return;
    const storedDoctorId = window.localStorage.getItem('doctorId');
    if (storedDoctorId) {
      void loadDashboard(storedDoctorId);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((entry) => entry.id === patientId);
    return patient
      ? `${patient.firstName} ${patient.lastName}`
      : 'Unknown Patient';
  };

  const formatSessionTime = (startedAt: number) => {
    const date = new Date(startedAt);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-deep-ink mb-1 font-serif text-2xl font-bold sm:text-3xl">
            {doctor?.name || 'Doctor Dashboard'}
          </h1>
          <p className="text-slate text-xs sm:text-sm">
            {doctor
              ? `${doctor.specialty} · ${doctor.clinic}`
              : 'Welcome back to your practice'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 rounded-lg text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link
            href="/dashboard/doctor/settings"
            className="flex-1 sm:flex-initial"
          >
            <Button
              size="sm"
              className="w-full rounded-lg text-xs font-semibold sm:w-auto"
            >
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Credential Verification Status Card for Pending or Rejected Doctors */}
      {doctor?.verificationStatus &&
        doctor.verificationStatus !== 'verified' && (
          <Card
            className={cn(
              'border p-5 shadow-xs sm:p-6',
              doctor.verificationStatus === 'pending'
                ? 'border-amber-200/80 bg-amber-50/70 text-amber-950'
                : 'border-rose-200 bg-rose-50/70 text-rose-950'
            )}
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                    doctor.verificationStatus === 'pending'
                      ? 'border-amber-300/80 bg-amber-100 text-amber-800'
                      : 'border-rose-300 bg-rose-100 text-rose-800'
                  )}
                >
                  {doctor.verificationStatus === 'pending' ? (
                    <Clock className="h-5 w-5 animate-pulse" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-bold tracking-wider uppercase',
                        doctor.verificationStatus === 'pending'
                          ? 'border-amber-300 bg-amber-100 text-amber-900'
                          : 'border-rose-300 bg-rose-100 text-rose-900'
                      )}
                    >
                      {doctor.verificationStatus === 'pending'
                        ? 'Verification In Progress'
                        : 'Action Required'}
                    </Badge>
                    <span className="text-slate/80 font-mono text-xs">
                      License:{' '}
                      {doctor.license && doctor.license !== 'LICENSE-PENDING'
                        ? doctor.license
                        : 'Pending submission'}
                    </span>
                  </div>
                  <h3 className="text-deep-ink font-serif text-base font-bold">
                    {doctor.verificationStatus === 'pending'
                      ? 'Clinical Credential Review Pending'
                      : 'Credential Verification Requires Revision'}
                  </h3>
                  <p className="text-slate max-w-2xl text-xs leading-relaxed sm:text-sm">
                    {doctor.verificationStatus === 'pending'
                      ? 'Your medical license and practice credentials are currently being reviewed by clinical administration. Patient consultations and SOAP note synthesis will unlock once approved.'
                      : `Your credentials were not approved: "${doctor.rejectionReason || 'Details incomplete'}". Please update your license information to resubmit for verification.`}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/doctor/onboarding"
                className="w-full shrink-0 sm:w-auto"
              >
                <Button
                  variant="dark"
                  size="sm"
                  className="w-full gap-2 rounded-lg text-xs font-semibold sm:w-auto"
                >
                  <span>
                    {doctor.verificationStatus === 'pending'
                      ? 'View Credential Details'
                      : 'Update & Resubmit'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

      {error &&
        (!doctor?.verificationStatus ||
          doctor.verificationStatus === 'verified') && (
          <ErrorAlert message={error} />
        )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Sessions"
          value={stats?.todaySessions.toString() || '0'}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Unique Patients"
          value={stats?.totalPatients.toString() || '0'}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Completed Sessions"
          value={stats?.completedSessions.toString() || '0'}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pending Notes"
          value={stats?.pendingNotes.toString() || '0'}
          icon={<FileEdit className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/dashboard/doctor/sessions/new" className="block">
              <Button className="h-10 w-full gap-2 rounded-lg py-2.5 text-xs font-semibold">
                <Plus className="h-4 w-4" />
                Start New Session
              </Button>
            </Link>
            <Link href="/dashboard/doctor/patients" className="block">
              <Button
                variant="outline"
                className="h-10 w-full gap-2 rounded-lg py-2.5 text-xs font-medium"
              >
                <Search className="h-4 w-4" />
                Search Patients
              </Button>
            </Link>
            <Link href="/dashboard/doctor/summaries" className="block">
              <Button
                variant="outline"
                className="h-10 w-full gap-2 rounded-lg py-2.5 text-xs font-medium"
              >
                <FileEdit className="h-4 w-4" />
                Review Summaries
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-deep-ink font-serif text-lg font-medium">
            Recent Sessions
          </h3>
          {sessions.length > 0 && (
            <Link
              href="/dashboard/doctor/sessions/new"
              className="text-slate hover:text-deep-ink text-xs font-medium"
            >
              View all sessions →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-slate py-12 text-center text-xs">
            Loading sessions...
          </div>
        ) : recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Start your first AI-assisted clinical consultation to see transcripts and SOAP notes here."
            action={
              <Link href="/dashboard/doctor/sessions/new">
                <Button
                  size="sm"
                  className="gap-2 rounded-lg text-xs font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Start New Session
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Card
                key={session.id}
                className="hover:border-hi-yellow/60 p-4 transition-colors sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h4 className="text-deep-ink font-serif text-base font-semibold">
                        {getPatientName(session.patientId)}
                      </h4>
                      <Badge
                        variant={
                          session.status === 'completed'
                            ? 'success'
                            : session.status === 'active'
                              ? 'default'
                              : 'draft'
                        }
                      >
                        {session.status === 'completed'
                          ? 'Completed'
                          : session.status === 'active'
                            ? 'In Progress'
                            : 'Archived'}
                      </Badge>
                    </div>
                    <p className="text-slate line-clamp-1 text-sm">
                      {session.soapNote?.assessment ||
                        'No clinical assessment yet'}
                    </p>
                    <div className="text-slate flex items-center gap-2 pt-1 text-xs">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatSessionTime(session.startedAt)}</span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    <Link
                      href={`/dashboard/doctor/sessions/${session.id}`}
                      className="block sm:inline"
                    >
                      <Button
                        size="sm"
                        variant={
                          session.status === 'completed'
                            ? 'secondary'
                            : 'default'
                        }
                        className="w-full rounded-full font-medium sm:w-auto"
                      >
                        {session.status === 'completed'
                          ? 'View Note'
                          : 'Continue Session'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
