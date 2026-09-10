'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { http } from '@/lib/http';
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'verified' | 'rejected' | 'all'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Dialog states
  const [approvingDoctor, setApprovingDoctor] = useState<DoctorItem | null>(
    null
  );
  const [rejectionModalDoctor, setRejectionModalDoctor] =
    useState<DoctorItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revokingDoctor, setRevokingDoctor] = useState<DoctorItem | null>(null);
  const [dossierDoctor, setDossierDoctor] = useState<DoctorItem | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    async function fetchMe() {
      try {
        const data = await http.get<{ user: AdminUser | null }>('/api/auth/me');
        if (data?.user) setAdminUser(data.user);
      } catch {
        // Fallback gracefully
      }
    }
    void fetchMe();
  }, []);

  const fetchDoctors = async () => {
    try {
      setRefreshing(true);
      const data = await http.get<{
        success: boolean;
        doctors: DoctorItem[];
        message?: string;
      }>('/api/admin/doctors');
      if (data?.success && Array.isArray(data.doctors)) {
        setDoctors(data.doctors);
        setLastUpdated(new Date());
      } else {
        throw new Error(data?.message || 'Failed to load clinicians');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load clinicians registry';
      setNotification({ type: 'error', message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDoctors();
  }, []);

  const counts = useMemo(
    () => ({
      pending: doctors.filter(
        (d) => (d.verificationStatus || 'pending') === 'pending'
      ).length,
      verified: doctors.filter((d) => d.verificationStatus === 'verified')
        .length,
      rejected: doctors.filter((d) => d.verificationStatus === 'rejected')
        .length,
      total: doctors.length,
    }),
    [doctors]
  );

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

  const handleApprove = async (doctor: DoctorItem) => {
    setActionLoadingId(doctor.id);
    setNotification(null);
    try {
      await http.post(`/api/admin/doctors/${doctor.id}/approve`, {});
      setNotification({
        type: 'success',
        message: `Dr. ${doctor.name} was successfully verified and granted clinical privileges.`,
      });
      setApprovingDoctor(null);
      if (dossierDoctor?.id === doctor.id) setDossierDoctor(null);
      await fetchDoctors();
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
      await http.post(`/api/admin/doctors/${target.id}/reject`, { reason });
      setNotification({
        type: 'success',
        message: `Clinical privileges for Dr. ${target.name} have been revoked.`,
      });
      setRejectionModalDoctor(null);
      setRevokingDoctor(null);
      setRejectionReason('');
      if (dossierDoctor?.id === target.id) setDossierDoctor(null);
      await fetchDoctors();
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    if (doctors.length === 0) return;
    const headers = [
      'Doctor ID',
      'Name',
      'Email',
      'Specialty',
      'Clinic',
      'Care Code',
      'License Number',
      'Issuing Authority',
      'Verification Status',
      'Registered At',
      'Verified At',
      'Verified By',
      'Rejection Reason',
    ];
    const rows = doctors.map((doc) => [
      `"${doc.id}"`,
      `"${doc.name.replace(/"/g, '""')}"`,
      `"${doc.email}"`,
      `"${doc.specialty}"`,
      `"${doc.clinic.replace(/"/g, '""')}"`,
      `"${doc.careCode}"`,
      `"${doc.license}"`,
      `"${doc.issuingAuthority || ''}"`,
      `"${doc.verificationStatus}"`,
      `"${new Date(doc.createdAt).toISOString()}"`,
      `"${doc.verifiedAt ? new Date(doc.verifiedAt).toISOString() : ''}"`,
      `"${doc.verifiedBy || ''}"`,
      `"${(doc.rejectionReason || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `noa-clinician-verification-audit-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({
      type: 'info',
      message: `Exported ${doctors.length} clinician records to CSV for clinical governance audit.`,
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/auth/login');
    }
  };

  return (
    <div className="bg-canvas text-deep-ink selection:bg-hi-yellow selection:text-deep-ink flex min-h-screen flex-col font-sans antialiased">
      <AdminHeader
        adminUser={adminUser}
        loading={loading}
        refreshing={refreshing}
        doctorsCount={doctors.length}
        lastUpdated={lastUpdated}
        onRefresh={fetchDoctors}
        onExport={handleExportCSV}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-3.5 pb-28 sm:space-y-6 sm:p-6 lg:p-8 lg:pb-8">
        {notification && (
          <div
            className={cn(
              'animate-in fade-in slide-in-from-top-2 flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs break-words shadow-xs transition-all sm:p-4 sm:text-sm',
              notification.type === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-900',
              notification.type === 'error' &&
                'border-rose-200 bg-rose-50 text-rose-900',
              notification.type === 'info' &&
                'border-teal-200 bg-teal-50 text-teal-900'
            )}
          >
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              {notification.type === 'success' && (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              )}
              {notification.type === 'error' && (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              )}
              {notification.type === 'info' && (
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
                  {notification.type === 'success'
                    ? 'Action Completed'
                    : notification.type === 'error'
                      ? 'Validation Notice'
                      : 'System Notice'}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed break-words sm:text-sm">
                  {notification.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <AdminMetrics
          counts={counts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <AdminToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          specialties={specialties}
          specialtyFilter={specialtyFilter}
          onSpecialtyChange={setSpecialtyFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          filteredCount={filteredDoctors.length}
          onReset={() => {
            setSearchQuery('');
            setSpecialtyFilter('all');
            setSortBy('newest');
            setActiveTab('all');
          }}
        />

        <AdminTable
          loading={loading}
          doctors={filteredDoctors}
          searchQuery={searchQuery}
          specialtyFilter={specialtyFilter}
          activeTab={activeTab}
          actionLoadingId={actionLoadingId}
          copiedCode={copiedCode}
          onCopy={handleCopy}
          onApproveClick={setApprovingDoctor}
          onRejectClick={(doc) => {
            setRejectionModalDoctor(doc);
            setRejectionReason('');
          }}
          onRevokeClick={(doc) => {
            setRevokingDoctor(doc);
            setRejectionReason('');
          }}
          onDossierClick={setDossierDoctor}
          onResetFilters={() => {
            setSearchQuery('');
            setSpecialtyFilter('all');
            setActiveTab('all');
          }}
        />
      </main>

      <ApprovalDialog
        doctor={approvingDoctor}
        actionLoading={actionLoadingId !== null}
        onConfirm={handleApprove}
        onClose={() => setApprovingDoctor(null)}
      />

      <RejectionDialog
        doctor={rejectionModalDoctor || revokingDoctor}
        isRevocation={Boolean(revokingDoctor)}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
        actionLoading={actionLoadingId !== null}
        onConfirm={handleReject}
        onClose={() => {
          setRejectionModalDoctor(null);
          setRevokingDoctor(null);
        }}
      />

      <DossierDialog
        doctor={dossierDoctor}
        onClose={() => setDossierDoctor(null)}
        onApprove={(doc) => setApprovingDoctor(doc)}
        onRevoke={(doc) => {
          setRevokingDoctor(doc);
          setRejectionReason('');
        }}
      />

      <BottomNav
        role="admin"
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
        badgeCounts={{
          pending: counts.pending > 0 ? counts.pending : undefined,
          verified: counts.verified > 0 ? counts.verified : undefined,
          rejected: counts.rejected > 0 ? counts.rejected : undefined,
          all: counts.total > 0 ? counts.total : undefined,
        }}
        className="lg:hidden"
      />
    </div>
  );
}
