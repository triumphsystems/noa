'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { BottomNav } from '@/components/navigation/bottom-nav';
import {
  AdminHeader,
  AdminMetrics,
  AdminToolbar,
  AdminTable,
  ApprovalDialog,
  RejectionDialog,
  DossierDialog,
  type DoctorItem,
  type AdminUser,
} from '@/components/admin';
import {
  approveDoctorAction,
  rejectDoctorAction,
  refreshAdminDashboard,
} from '@/app/dashboard/admin/actions';

interface AdminDashboardViewProps {
  initialDoctors: DoctorItem[];
  initialCounts: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
  adminUser?: AdminUser | null;
}

export function AdminDashboardView({
  initialDoctors,
  initialCounts,
  adminUser,
}: AdminDashboardViewProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [doctors, setDoctors] = useState<DoctorItem[]>(initialDoctors);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'verified' | 'rejected' | 'all'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Dialog states
  const [approvingDoctor, setApprovingDoctor] = useState<DoctorItem | null>(null);
  const [rejectionModalDoctor, setRejectionModalDoctor] = useState<DoctorItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revokingDoctor, setRevokingDoctor] = useState<DoctorItem | null>(null);
  const [dossierDoctor, setDossierDoctor] = useState<DoctorItem | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sync with incoming server data when path revalidates
  useEffect(() => {
    setDoctors(initialDoctors);
    setLastUpdated(new Date());
  }, [initialDoctors]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors
      .filter((doc) => {
        const status = doc.verificationStatus || 'pending';
        const matchesTab = activeTab === 'all' || status === activeTab;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          doc.name.toLowerCase().includes(query) ||
          doc.email.toLowerCase().includes(query) ||
          doc.clinic.toLowerCase().includes(query) ||
          doc.license.toLowerCase().includes(query) ||
          doc.careCode.toLowerCase().includes(query) ||
          doc.specialty.toLowerCase().includes(query) ||
          (doc.issuingAuthority &&
            doc.issuingAuthority.toLowerCase().includes(query));

        const matchesSpecialty =
          specialtyFilter === 'all' ||
          doc.specialty.toLowerCase() === specialtyFilter.toLowerCase();

        return matchesTab && matchesSearch && matchesSpecialty;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [doctors, activeTab, searchQuery, specialtyFilter, sortBy]);

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshAdminDashboard();
    });
  };

  const handleApprove = async (doctor: DoctorItem) => {
    setActionLoadingId(doctor.id);
    setNotification(null);
    try {
      const res = await approveDoctorAction(doctor.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message:
            res.message ||
            `Dr. ${doctor.name} was successfully verified and granted clinical privileges.`,
        });
        setApprovingDoctor(null);
        if (dossierDoctor?.id === doctor.id) setDossierDoctor(null);
      } else {
        throw new Error(res.error || 'Failed to approve clinician verification.');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to approve clinician verification.';
      setNotification({ type: 'error', message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    const target = rejectionModalDoctor || revokingDoctor;
    if (!target) return;
    setActionLoadingId(target.id);
    setNotification(null);
    const reason =
      rejectionReason.trim() ||
      'Medical credentials could not be verified with the issuing authority.';

    try {
      const res = await rejectDoctorAction(target.id, reason);
      if (res.success) {
        setNotification({
          type: 'success',
          message:
            res.message ||
            `Clinical privileges for Dr. ${target.name} have been revoked.`,
        });
        setRejectionModalDoctor(null);
        setRevokingDoctor(null);
        setRejectionReason('');
        if (dossierDoctor?.id === target.id) setDossierDoctor(null);
      } else {
        throw new Error(res.error || 'Failed to revoke clinician status.');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to revoke clinician status.';
      setNotification({ type: 'error', message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/auth/login');
    }
  };

  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          role="alert"
          className={cn(
            'animate-in fade-in slide-in-from-top-4 fixed top-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md',
            notification.type === 'success' &&
              'border-emerald-200/80 bg-emerald-50/95 text-emerald-900',
            notification.type === 'error' &&
              'border-rose-200/80 bg-rose-50/95 text-rose-900',
            notification.type === 'info' &&
              'border-blue-200/80 bg-blue-50/95 text-blue-900'
          )}
        >
          {notification.type === 'success' && (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          )}
          {notification.type === 'error' && (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          )}
          {notification.type === 'info' && (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          )}
          <div className="flex-1 text-xs sm:text-sm font-medium">
            {notification.message}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="hover:bg-deep-ink/5 -mr-1 -mt-1 cursor-pointer rounded-lg p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Admin Top Header */}
      <AdminHeader
        adminUser={adminUser}
        lastUpdated={lastUpdated}
        refreshing={isPending}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
      />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Metrics Overview */}
          <AdminMetrics counts={initialCounts} activeTab={activeTab} />

          {/* Search, Filter & Tabs Toolbar */}
          <AdminToolbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={initialCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            specialtyFilter={specialtyFilter}
            onSpecialtyFilterChange={setSpecialtyFilter}
            specialties={specialties}
            sortBy={sortBy}
            onSortChange={setSortChangeState}
          />

          {/* Clinicians Table */}
          <AdminTable
            doctors={filteredDoctors}
            loading={isPending}
            actionLoadingId={actionLoadingId}
            copiedCode={copiedCode}
            onCopyCode={handleCopyCode}
            onViewDossier={setDossierDoctor}
            onApprove={setApprovingDoctor}
            onReject={setRejectionModalDoctor}
            onRevoke={setRevokingDoctor}
          />
        </div>
      </main>

      {/* Dialogs */}
      <ApprovalDialog
        doctor={approvingDoctor}
        actionLoading={actionLoadingId === approvingDoctor?.id}
        onClose={() => setApprovingDoctor(null)}
        onConfirm={() => approvingDoctor && handleApprove(approvingDoctor)}
      />

      <RejectionDialog
        doctor={rejectionModalDoctor}
        revokingDoctor={revokingDoctor}
        actionLoading={
          actionLoadingId ===
          (rejectionModalDoctor?.id || revokingDoctor?.id)
        }
        rejectionReason={rejectionReason}
        onReasonChange={setRejectionReason}
        onClose={() => {
          setRejectionModalDoctor(null);
          setRevokingDoctor(null);
          setRejectionReason('');
        }}
        onConfirm={handleReject}
      />

      <DossierDialog
        doctor={dossierDoctor}
        actionLoadingId={actionLoadingId}
        onClose={() => setDossierDoctor(null)}
        onApprove={(doc) => {
          setDossierDoctor(null);
          setApprovingDoctor(doc);
        }}
        onReject={(doc) => {
          setDossierDoctor(null);
          setRejectionModalDoctor(doc);
        }}
        onRevoke={(doc) => {
          setDossierDoctor(null);
          setRevokingDoctor(doc);
        }}
      />

      {/* Mobile Bottom Navigation Dock */}
      <div className="sm:hidden">
        <BottomNav
          role="admin"
          activeTab={activeTab}
          onTabChange={(tab) =>
            setActiveTab(tab as 'pending' | 'verified' | 'rejected' | 'all')
          }
          badgeCounts={{
            pending: initialCounts.pending > 0 ? initialCounts.pending : undefined,
          }}
          floatingDockOnDesktop={false}
        />
      </div>
    </div>
  );

  function setSortChangeState(newSort: string) {
    if (newSort === 'newest' || newSort === 'oldest' || newSort === 'name') {
      setSortBy(newSort);
    }
  }
}
