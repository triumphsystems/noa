'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Stethoscope,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  LogOut,
  Building,
  Award,
  ExternalLink,
  AlertTriangle,
  Copy,
  Check,
  Download,
  FileText,
  UserCheck,
  ShieldAlert,
  ArrowUpDown,
  ChevronDown,
  Eye,
  Info,
  Sparkles,
  X,
  Mail,
  Phone,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/navigation/bottom-nav';

interface DoctorItem {
  id: string;
  name: string;
  email: string;
  specialty: string;
  license: string;
  issuingAuthority: string | null;
  licenseDocumentUrl: string | null;
  clinic: string;
  careCode: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt: number | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  phone: string | null;
  createdAt: number;
  updatedAt?: number;
}

interface AdminUser {
  id?: string;
  name?: string;
  email?: string;
  userType?: string;
}

const REJECTION_PRESETS = [
  'Medical credentials could not be verified on the state medical board registry.',
  'Submitted medical license or credentials appear to be expired or invalid.',
  'Incomplete documentation: Medical license certificate could not be validated.',
  'Clinic affiliation and primary practice address could not be confirmed.',
];

export default function AdminDashboardPage() {
  const router = useRouter();
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

  // Admin user details
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Modals state
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

  // Auto-dismiss notifications after 6s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Fetch current admin user profile
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAdminUser(data.user);
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    void fetchMe();
  }, []);

  const fetchDoctors = async () => {
    try {
      setRefreshing(true);
      // Fetch full directory so metric counts remain persistent & accurate across all tabs
      const res = await fetch('/api/admin/doctors');

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?from=/dashboard/admin');
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.doctors)) {
        setDoctors(data.doctors);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.message || 'Failed to load clinicians');
      }
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err);
      setNotification({
        type: 'error',
        message:
          err.message ||
          'Failed to load clinicians registry. Please check network connection.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDoctors();
  }, []);

  // Calculate accurate global counts regardless of current tab or search
  const counts = useMemo(() => {
    return {
      pending: doctors.filter(
        (d) => (d.verificationStatus || 'pending') === 'pending'
      ).length,
      verified: doctors.filter((d) => d.verificationStatus === 'verified')
        .length,
      rejected: doctors.filter((d) => d.verificationStatus === 'rejected')
        .length,
      total: doctors.length,
    };
  }, [doctors]);

  // Extract unique specialties for filtering
  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  // Filter and sort clinicians
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
        if (sortBy === 'newest') {
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [doctors, activeTab, searchQuery, specialtyFilter, sortBy]);

  const handleApprove = async (doctor: DoctorItem) => {
    setActionLoadingId(doctor.id);
    setNotification(null);

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verification approval failed.');
      }

      setNotification({
        type: 'success',
        message: `Dr. ${doctor.name} was successfully verified and granted clinical privileges.`,
      });
      setApprovingDoctor(null);
      if (dossierDoctor?.id === doctor.id) {
        setDossierDoctor(null);
      }
      await fetchDoctors();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to approve clinician verification.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    const targetDoctor = rejectionModalDoctor || revokingDoctor;
    if (!targetDoctor) return;

    setActionLoadingId(targetDoctor.id);
    setNotification(null);

    const finalReason =
      rejectionReason.trim() ||
      'Medical credentials could not be verified with the issuing authority.';

    try {
      const res = await fetch(`/api/admin/doctors/${targetDoctor.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Status revocation failed.');
      }

      setNotification({
        type: 'success',
        message: `Clinical privileges for Dr. ${targetDoctor.name} have been revoked.`,
      });
      setRejectionModalDoctor(null);
      setRevokingDoctor(null);
      setRejectionReason('');
      if (dossierDoctor?.id === targetDoctor.id) {
        setDossierDoctor(null);
      }
      await fetchDoctors();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to revoke clinician status.',
      });
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

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
      router.push('/auth/login');
    }
  };

  const getDoctorInitials = (name: string) => {
    const clean = name.replace(/^dr\.?\s+/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 0) return 'MD';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="bg-canvas text-deep-ink selection:bg-hi-yellow selection:text-deep-ink flex min-h-screen flex-col font-sans antialiased">
      {/* Top Admin Navigation Header (Harmonized with Noa Brand) */}
      <header className="border-deep-ink/10 sticky top-0 z-30 border-b bg-white/85 px-4 py-3.5 backdrop-blur-md transition-shadow sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {/* Brand & Console Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Noa Logo"
              className="h-9 w-9 shrink-0 rounded-xl shadow-2xs"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-deep-ink font-serif text-xl font-bold tracking-tight">
                  Noa
                </span>
                <span className="bg-soft-meadow text-deep-ink border-deep-ink/10 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                  Superadmin Console
                </span>
                <span className="bg-canvas text-deep-ink/80 border-deep-ink/10 hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  Clinical Governance Gateway
                </span>
              </div>
              <p className="text-slate mt-0.5 text-xs font-medium">
                Clinician Verification & Medical Practice Governance
              </p>
            </div>
          </div>

          {/* Right Controls: User Profile, CSV Export, Refresh, Logout */}
          <div className="flex flex-wrap items-center justify-between gap-2 self-stretch sm:justify-end sm:self-auto">
            {/* Admin identity pill */}
            <div className="bg-soft-meadow border-deep-ink/10 hidden items-center gap-2 rounded-xl border px-3 py-1.5 text-xs md:flex">
              <div className="text-deep-ink border-deep-ink/10 flex h-6 w-6 items-center justify-center rounded-full border bg-white font-serif text-[10px] font-bold">
                {adminUser?.name ? getDoctorInitials(adminUser.name) : 'SA'}
              </div>
              <div className="text-left">
                <span className="text-deep-ink block max-w-[130px] truncate font-semibold">
                  {adminUser?.name || 'Administrator'}
                </span>
                <span className="text-slate block text-[10px]">
                  Admins Cognito Group
                </span>
              </div>
            </div>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading || doctors.length === 0}
              className="text-deep-ink border-deep-ink/10 hover:bg-soft-meadow shadow-editorial h-9 gap-1.5 bg-white text-xs"
              title="Download full clinician audit log as CSV"
            >
              <Download className="text-slate h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Audit</span>
            </Button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDoctors}
              disabled={refreshing}
              className="text-deep-ink border-deep-ink/10 hover:bg-soft-meadow shadow-editorial h-9 gap-1.5 bg-white text-xs"
              title={`Last refreshed: ${lastUpdated.toLocaleTimeString()}`}
            >
              <RefreshCw
                className={cn(
                  'text-slate h-3.5 w-3.5',
                  refreshing && 'text-deep-ink animate-spin'
                )}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-3.5 pb-28 sm:space-y-6 sm:p-6 lg:p-8 lg:pb-8">
        {/* Notification Banner with Smooth Presentation */}
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
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Executive KPI Metric Cards (Compact 2x2 on Mobile, 4 columns on Desktop) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Pending */}
          <div
            onClick={() => setActiveTab('pending')}
            role="button"
            tabIndex={0}
            className={cn(
              'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
              activeTab === 'pending'
                ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-amber-50/20 ring-2'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
                Pending Review
              </span>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 text-amber-800 sm:h-8 sm:w-8">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
              <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
                {counts.pending}
              </span>
              {counts.pending > 0 && (
                <span className="py-0.2 rounded-full border border-amber-300/40 bg-amber-200/50 px-1.5 text-[10px] font-semibold text-amber-900 sm:px-2 sm:py-0.5 sm:text-[11px]">
                  Action
                </span>
              )}
            </div>
            <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
              Awaiting review
            </p>
            {activeTab === 'pending' && (
              <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
            )}
          </div>

          {/* Card 2: Verified */}
          <div
            onClick={() => setActiveTab('verified')}
            role="button"
            tabIndex={0}
            className={cn(
              'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
              activeTab === 'verified'
                ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-emerald-50/20 ring-2'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
                Verified
              </span>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800 sm:h-8 sm:w-8">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
              <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
                {counts.verified}
              </span>
              <span className="py-0.2 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-800 sm:px-2 sm:py-0.5 sm:text-[11px]">
                Active
              </span>
            </div>
            <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
              Active licensed
            </p>
            {activeTab === 'verified' && (
              <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
            )}
          </div>

          {/* Card 3: Rejected */}
          <div
            onClick={() => setActiveTab('rejected')}
            role="button"
            tabIndex={0}
            className={cn(
              'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
              activeTab === 'rejected'
                ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-rose-50/20 ring-2'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
                Revoked
              </span>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100/80 text-rose-800 sm:h-8 sm:w-8">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
              <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
                {counts.rejected}
              </span>
              {counts.rejected > 0 && (
                <span className="py-0.2 rounded-full border border-rose-200 bg-rose-100 px-1.5 text-[10px] font-semibold text-rose-800 sm:px-2 sm:py-0.5 sm:text-[11px]">
                  Restricted
                </span>
              )}
            </div>
            <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
              Revoked access
            </p>
            {activeTab === 'rejected' && (
              <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
            )}
          </div>

          {/* Card 4: Total */}
          <div
            onClick={() => setActiveTab('all')}
            role="button"
            tabIndex={0}
            className={cn(
              'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
              activeTab === 'all'
                ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-soft-meadow/40 ring-2'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
                Total
              </span>
              <div className="bg-soft-meadow text-deep-ink border-deep-ink/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border sm:h-8 sm:w-8">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
              <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
                {counts.total}
              </span>
              <span className="text-slate bg-soft-meadow py-0.2 border-deep-ink/10 rounded-full border px-1.5 text-[10px] font-medium sm:px-2 sm:py-0.5 sm:text-[11px]">
                All
              </span>
            </div>
            <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
              All clinicians
            </p>
            {activeTab === 'all' && (
              <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
            )}
          </div>
        </div>

        {/* Command Toolbar: Search, Specialty Filter, Sort, Status Segmented Tabs */}
        <div className="border-deep-ink/8 shadow-editorial space-y-3.5 rounded-2xl border bg-white p-4">
          <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
            {/* Search Input with Clear Button */}
            <div className="relative max-w-md flex-1">
              <Search className="text-slate absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, clinic, license #, or care code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-deep-ink/10 bg-canvas focus:ring-deep-ink/20 text-deep-ink placeholder:text-slate/60 w-full rounded-xl border py-2 pr-9 pl-10 text-sm transition-all focus:bg-white focus:ring-2 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate hover:text-deep-ink absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded p-0.5"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter and Sort Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Specialty Dropdown */}
              {specialties.length > 0 && (
                <div className="text-slate flex items-center gap-1.5 text-xs">
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    aria-label="Filter by specialty"
                    className="border-deep-ink/10 bg-canvas text-deep-ink focus:ring-deep-ink/20 cursor-pointer rounded-xl border px-3 py-2 text-xs focus:ring-2 focus:outline-none"
                  >
                    <option value="all">All Specialties</option>
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Order Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort order"
                className="border-deep-ink/10 bg-canvas text-deep-ink focus:ring-deep-ink/20 cursor-pointer rounded-xl border px-3 py-2 text-xs focus:ring-2 focus:outline-none"
              >
                <option value="newest">Newest Registered</option>
                <option value="oldest">Oldest Registered</option>
                <option value="name">Name (A-Z)</option>
              </select>

              {/* Segmented Status Tabs */}
              <div className="bg-soft-meadow border-deep-ink/8 flex w-full scrollbar-none gap-1 overflow-x-auto rounded-xl border p-1 sm:w-auto">
                {(
                  [
                    { id: 'pending', label: 'Pending', count: counts.pending },
                    {
                      id: 'verified',
                      label: 'Verified',
                      count: counts.verified,
                    },
                    {
                      id: 'rejected',
                      label: 'Rejected',
                      count: counts.rejected,
                    },
                    { id: 'all', label: 'All', count: counts.total },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all',
                      activeTab === tab.id
                        ? 'text-deep-ink border-deep-ink/8 border bg-white font-semibold shadow-2xs'
                        : 'text-slate hover:text-deep-ink'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'py-0.2 rounded-full px-1.5 text-[10px]',
                        activeTab === tab.id
                          ? 'bg-soft-meadow text-deep-ink font-bold'
                          : 'bg-deep-ink/5 text-slate'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Subtext */}
          <div className="text-slate border-deep-ink/6 flex items-center justify-between border-t pt-1 text-xs">
            <span>
              Showing{' '}
              <strong className="text-deep-ink">
                {filteredDoctors.length}
              </strong>{' '}
              {filteredDoctors.length === 1 ? 'clinician' : 'clinicians'}
              {searchQuery && ` matching "${searchQuery}"`}
              {activeTab !== 'all' && ` with status "${activeTab}"`}
            </span>
            {(searchQuery ||
              specialtyFilter !== 'all' ||
              activeTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSpecialtyFilter('all');
                  setActiveTab('all');
                }}
                className="text-deep-ink cursor-pointer font-semibold underline underline-offset-2 hover:opacity-75"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Clinicians Registry List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            /* Skeleton Loading State */
            <div className="space-y-6 p-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse flex-col justify-between gap-4 md:flex-row"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-44 rounded bg-slate-200" />
                        <div className="h-3 w-28 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-4">
                      <div className="h-3 rounded bg-slate-100" />
                      <div className="h-3 rounded bg-slate-100" />
                      <div className="h-3 rounded bg-slate-100" />
                      <div className="h-3 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-20 rounded-lg bg-slate-200" />
                    <div className="h-8 w-20 rounded-lg bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDoctors.length === 0 ? (
            /* Enhanced Empty State */
            <div className="space-y-3 p-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <Stethoscope className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-800">
                No clinicians found
              </h3>
              <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">
                {searchQuery || specialtyFilter !== 'all'
                  ? 'No practitioner profiles match your current search query or specialty filter.'
                  : activeTab === 'pending'
                    ? 'Great job! All submitted clinician registrations have been fully reviewed and verified.'
                    : `There are currently no clinicians with the status "${activeTab}".`}
              </p>
              {(searchQuery ||
                specialtyFilter !== 'all' ||
                activeTab !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSpecialtyFilter('all');
                    setActiveTab('all');
                  }}
                  className="mt-2 text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            /* Clinician Dossier Cards */
            <div className="divide-deep-ink/5 divide-y">
              {filteredDoctors.map((doctor) => {
                const status = doctor.verificationStatus || 'pending';
                const isPending = status === 'pending';
                const isVerified = status === 'verified';
                const isRejected = status === 'rejected';

                return (
                  <div
                    key={doctor.id}
                    className="hover:bg-soft-meadow/30 flex flex-col justify-between gap-4 p-4 transition-colors sm:gap-6 sm:p-6 lg:flex-row lg:items-center"
                  >
                    {/* Left Clinician Identity & Metadata */}
                    <div className="min-w-0 flex-1 space-y-3.5">
                      {/* Name, Status Badge, Care Code, Email */}
                      <div className="flex items-start gap-3 sm:items-center sm:gap-3.5">
                        {/* Avatar */}
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-serif text-sm font-bold shadow-2xs sm:h-11 sm:w-11',
                            isVerified &&
                              'border-emerald-200/80 bg-emerald-50 text-emerald-800',
                            isPending &&
                              'border-amber-200/80 bg-amber-50 text-amber-900',
                            isRejected &&
                              'border-rose-200/80 bg-rose-50 text-rose-900'
                          )}
                        >
                          {getDoctorInitials(doctor.name)}
                        </div>

                        {/* Name & Badges */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
                              Dr. {doctor.name.replace(/^dr\.?\s+/i, '')}
                            </h3>

                            {/* Status badge */}
                            <span
                              className={cn(
                                'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs',
                                isVerified &&
                                  'border-emerald-200/80 bg-emerald-50 text-emerald-800',
                                isPending &&
                                  'border-amber-200/80 bg-amber-50 text-amber-900',
                                isRejected &&
                                  'border-rose-200/80 bg-rose-50 text-rose-900'
                              )}
                            >
                              {isVerified && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                              )}
                              {isPending && (
                                <Clock className="h-3 w-3 text-amber-700" />
                              )}
                              {isRejected && (
                                <XCircle className="h-3 w-3 text-rose-700" />
                              )}
                              <span className="capitalize">{status}</span>
                            </span>

                            {/* Care Code with 1-Click Copy */}
                            <button
                              onClick={() =>
                                handleCopy(doctor.careCode, `code-${doctor.id}`)
                              }
                              className="bg-soft-meadow text-deep-ink border-deep-ink/10 hover:bg-soft-meadow/80 flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold transition-colors"
                              title="Click to copy care code"
                            >
                              <span>{doctor.careCode}</span>
                              {copiedCode === `code-${doctor.id}` ? (
                                <Check className="h-3 w-3 text-emerald-700" />
                              ) : (
                                <Copy className="text-slate h-3 w-3" />
                              )}
                            </button>
                          </div>

                          <div className="text-slate mt-1 flex flex-wrap items-center gap-3 text-xs">
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <Mail className="text-slate/70 h-3 w-3 shrink-0" />
                              <span className="text-deep-ink font-medium break-all">
                                {doctor.email}
                              </span>
                            </span>
                            {doctor.phone && (
                              <span className="inline-flex shrink-0 items-center gap-1">
                                <Phone className="text-slate/70 h-3 w-3" />
                                <span>{doctor.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credential Data Grid */}
                      <div className="bg-soft-meadow/50 border-deep-ink/8 grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl border p-3 text-xs sm:grid-cols-2 sm:gap-x-6 sm:p-3.5 lg:grid-cols-3">
                        <div>
                          <span className="text-slate block text-[11px] font-medium">
                            Specialty
                          </span>
                          <span className="text-deep-ink font-semibold">
                            {doctor.specialty || 'General Practice'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate block text-[11px] font-medium">
                            Clinic Affiliation
                          </span>
                          <span
                            className="text-deep-ink block truncate font-semibold"
                            title={doctor.clinic}
                          >
                            {doctor.clinic || 'Independent Practice'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate block text-[11px] font-medium">
                            Medical License #
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-deep-ink border-deep-ink/10 rounded border bg-white px-1.5 py-0.5 font-mono text-xs font-bold break-all">
                              {doctor.license}
                            </span>
                            {/* Medical board lookup link */}
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(
                                `medical license registry verification "${doctor.license}" "${doctor.name}"`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-deep-ink hover:text-slate inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium hover:underline"
                              title="Search state medical registry"
                            >
                              <span>Verify Board</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate block text-[11px] font-medium">
                            Issuing Authority
                          </span>
                          <span className="text-deep-ink/80 block truncate font-medium">
                            {doctor.issuingAuthority || 'State Medical Board'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate block text-[11px] font-medium">
                            Registered Date
                          </span>
                          <span className="text-deep-ink/80">
                            {new Date(doctor.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate block text-[11px] font-medium">
                            License Documentation
                          </span>
                          {doctor.licenseDocumentUrl ? (
                            <a
                              href={doctor.licenseDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-deep-ink hover:text-slate inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2"
                            >
                              <FileCheck className="text-deep-ink/70 h-3 w-3" />
                              <span>View Certificate</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <span className="text-slate/60 italic">
                              Self-attested (no file)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Note if applicable */}
                      {doctor.rejectionReason && (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/90 p-3 text-xs break-words text-rose-950">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                          <div className="min-w-0 flex-1">
                            <span className="block font-semibold text-rose-900">
                              Credential Revocation Reason:
                            </span>
                            <span className="leading-relaxed break-words">
                              {doctor.rejectionReason}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Verification Audit Note if verified */}
                      {isVerified && doctor.verifiedAt && (
                        <div className="text-slate flex flex-wrap items-center gap-2 text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                          <span>
                            Verified on{' '}
                            {new Date(doctor.verifiedAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}{' '}
                            by {doctor.verifiedBy || 'Superadministrator'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Governance Actions (Full width on mobile, right-aligned on desktop) */}
                    <div className="border-deep-ink/8 flex w-full flex-wrap items-center justify-stretch gap-2 border-t pt-3 sm:flex-nowrap sm:justify-end lg:w-auto lg:border-t-0 lg:pt-0">
                      {/* View Full Dossier */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDossierDoctor(doctor)}
                        className="text-deep-ink hover:text-deep-ink hover:bg-soft-meadow border-deep-ink/10 min-h-[38px] flex-1 justify-center gap-1 rounded-xl border text-xs sm:flex-initial"
                      >
                        <Eye className="text-slate h-3.5 w-3.5" />
                        <span>Dossier</span>
                      </Button>

                      {/* Pending: Approve & Reject buttons */}
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setApprovingDoctor(doctor)}
                            disabled={actionLoadingId === doctor.id}
                            className="bg-deep-ink hover:bg-deep-ink/90 min-h-[38px] flex-1 cursor-pointer justify-center gap-1.5 rounded-xl text-xs font-semibold text-white shadow-xs sm:flex-initial"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Approve</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectionModalDoctor(doctor);
                              setRejectionReason('');
                            }}
                            disabled={actionLoadingId === doctor.id}
                            className="min-h-[38px] flex-1 cursor-pointer justify-center gap-1.5 rounded-xl border-rose-200/90 text-xs font-semibold text-rose-800 hover:border-rose-300 hover:bg-rose-50 sm:flex-initial"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}

                      {/* Rejected: Re-Verify button */}
                      {isRejected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setApprovingDoctor(doctor)}
                          disabled={actionLoadingId === doctor.id}
                          className="text-deep-ink border-deep-ink/20 hover:bg-soft-meadow min-h-[38px] flex-1 cursor-pointer justify-center gap-1.5 rounded-xl text-xs font-semibold sm:flex-initial"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Re-Verify</span>
                        </Button>
                      )}

                      {/* Verified: Revoke Access button */}
                      {isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRevokingDoctor(doctor);
                            setRejectionReason('');
                          }}
                          disabled={actionLoadingId === doctor.id}
                          className="text-slate border-deep-ink/10 min-h-[38px] flex-1 cursor-pointer justify-center gap-1 rounded-xl text-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:flex-initial"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Revoke Access</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Approval Confirmation Modal */}
      {approvingDoctor && (
        <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="shadow-editorial-elevated border-deep-ink/10 w-full max-w-lg space-y-4 rounded-2xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-800">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-deep-ink font-serif text-base font-bold">
                  Grant Clinical Practice Privileges
                </h3>
                <p className="text-slate text-xs">Dr. {approvingDoctor.name}</p>
              </div>
            </div>

            <div className="bg-soft-meadow/70 border-deep-ink/8 text-deep-ink space-y-1.5 rounded-xl border p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate">Email:</span>
                <span className="font-medium">{approvingDoctor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">License Number:</span>
                <span className="text-deep-ink font-mono font-bold">
                  {approvingDoctor.license}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Specialty:</span>
                <span className="font-medium">{approvingDoctor.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Clinic:</span>
                <span className="font-medium">{approvingDoctor.clinic}</span>
              </div>
            </div>

            <div className="text-slate space-y-1 text-xs leading-relaxed">
              <p>
                Approving this clinician will assign their Cognito account to
                the <strong>Doctors</strong> security group, enabling full
                access to patient health records, live clinical sessions, and
                prescription creation.
              </p>
              <p className="font-medium text-emerald-800">
                An audit entry will be permanently logged in DynamoDB with your
                Administrator ID.
              </p>
            </div>

            <div className="border-deep-ink/8 flex justify-end gap-2.5 border-t pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingDoctor(null)}
                disabled={actionLoadingId !== null}
                className="border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-soft-meadow rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(approvingDoctor)}
                disabled={actionLoadingId !== null}
                className="bg-deep-ink hover:bg-deep-ink/90 cursor-pointer gap-1.5 rounded-xl font-semibold text-white"
              >
                {actionLoadingId === approvingDoctor.id ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Confirm Verification</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection / Revocation Modal */}
      {(rejectionModalDoctor || revokingDoctor) && (
        <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="shadow-editorial-elevated border-deep-ink/10 w-full max-w-lg space-y-4 rounded-2xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50 text-rose-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-deep-ink font-serif text-base font-bold">
                  {revokingDoctor
                    ? 'Revoke Clinical Privileges'
                    : 'Reject Clinician Application'}
                </h3>
                <p className="text-slate text-xs">
                  Dr. {(rejectionModalDoctor || revokingDoctor)?.name} (
                  {(rejectionModalDoctor || revokingDoctor)?.email})
                </p>
              </div>
            </div>

            <p className="text-slate text-xs leading-relaxed">
              Select or specify why this clinician cannot be certified. This
              notice will be recorded in the clinical governance audit trail and
              revoke active privileges.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-slate text-[11px] font-semibold tracking-wider uppercase">
                Common Administrative Reasons:
              </span>
              <div className="space-y-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={cn(
                      'block w-full cursor-pointer rounded-xl border p-2.5 text-left text-xs transition-all',
                      rejectionReason === preset
                        ? 'border-rose-300 bg-rose-50 font-medium text-rose-950'
                        : 'bg-soft-meadow/50 text-slate border-deep-ink/10 hover:bg-soft-meadow hover:text-deep-ink'
                    )}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div className="space-y-1">
              <label className="text-deep-ink text-xs font-semibold">
                Detailed Feedback / Notes:
              </label>
              <textarea
                rows={3}
                placeholder="Enter specific audit findings or state medical board reference..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="border-deep-ink/15 focus:ring-deep-ink/20 focus:border-deep-ink bg-canvas text-deep-ink w-full rounded-xl border p-3 text-xs focus:ring-2 focus:outline-none"
              />
            </div>

            <div className="border-deep-ink/8 flex justify-end gap-2.5 border-t pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectionModalDoctor(null);
                  setRevokingDoctor(null);
                }}
                disabled={actionLoadingId !== null}
                className="border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-soft-meadow rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={actionLoadingId !== null}
                className="cursor-pointer gap-1.5 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700"
              >
                {actionLoadingId !== null ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>
                      {revokingDoctor
                        ? 'Confirm Revocation'
                        : 'Confirm Rejection'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Clinician Full Dossier Modal */}
      {dossierDoctor && (
        <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="shadow-editorial-elevated border-deep-ink/10 max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-2xl border bg-white p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="bg-soft-meadow text-deep-ink border-deep-ink/10 flex h-12 w-12 items-center justify-center rounded-xl border font-serif text-base font-bold">
                  {getDoctorInitials(dossierDoctor.name)}
                </div>
                <div>
                  <h2 className="text-deep-ink font-serif text-lg font-bold">
                    Dr. {dossierDoctor.name}
                  </h2>
                  <p className="text-slate text-xs">
                    Care Code: {dossierDoctor.careCode} • {dossierDoctor.clinic}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDossierDoctor(null)}
                className="text-slate hover:text-deep-ink hover:bg-soft-meadow cursor-pointer rounded-lg p-1.5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="bg-soft-meadow/60 border-deep-ink/8 flex items-center justify-between rounded-xl border p-3.5">
              <div className="flex items-center gap-2">
                <span className="text-slate text-xs font-semibold tracking-wider uppercase">
                  Status:
                </span>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize',
                    dossierDoctor.verificationStatus === 'verified' &&
                      'border-emerald-200/80 bg-emerald-50 text-emerald-800',
                    dossierDoctor.verificationStatus === 'pending' &&
                      'border-amber-200/80 bg-amber-50 text-amber-900',
                    dossierDoctor.verificationStatus === 'rejected' &&
                      'border-rose-200/80 bg-rose-50 text-rose-900'
                  )}
                >
                  {dossierDoctor.verificationStatus}
                </span>
              </div>
              <span className="text-slate text-xs">
                Registered: {new Date(dossierDoctor.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Dossier sections */}
            <div className="space-y-4 text-xs">
              <h4 className="text-deep-ink text-[11px] font-bold tracking-wider uppercase">
                Contact & Clinic Details
              </h4>
              <div className="bg-soft-meadow/40 border-deep-ink/8 grid grid-cols-2 gap-4 rounded-xl border p-4">
                <div>
                  <span className="text-slate block font-medium">
                    Full Legal Name
                  </span>
                  <span className="text-deep-ink font-semibold">
                    {dossierDoctor.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate block font-medium">
                    Primary Email
                  </span>
                  <span className="text-deep-ink font-semibold">
                    {dossierDoctor.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate block font-medium">
                    Specialty Practice
                  </span>
                  <span className="text-deep-ink font-semibold">
                    {dossierDoctor.specialty}
                  </span>
                </div>
                <div>
                  <span className="text-slate block font-medium">
                    Affiliated Health Clinic
                  </span>
                  <span className="text-deep-ink font-semibold">
                    {dossierDoctor.clinic}
                  </span>
                </div>
              </div>

              <h4 className="text-deep-ink text-[11px] font-bold tracking-wider uppercase">
                Licensure Credentials
              </h4>
              <div className="bg-soft-meadow/40 border-deep-ink/8 grid grid-cols-2 gap-4 rounded-xl border p-4">
                <div>
                  <span className="text-slate block font-medium">
                    License / NPI Number
                  </span>
                  <span className="text-deep-ink font-mono text-sm font-bold">
                    {dossierDoctor.license}
                  </span>
                </div>
                <div>
                  <span className="text-slate block font-medium">
                    Issuing Board Authority
                  </span>
                  <span className="text-deep-ink font-semibold">
                    {dossierDoctor.issuingAuthority || 'State Board'}
                  </span>
                </div>
                <div>
                  <span className="text-slate block font-medium">
                    Official Registry Lookup
                  </span>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `medical board license verification "${dossierDoctor.license}" "${dossierDoctor.name}"`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-deep-ink inline-flex items-center gap-1 font-semibold hover:underline"
                  >
                    <span>Check State Registry</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate block font-medium">
                    Certificate Document
                  </span>
                  {dossierDoctor.licenseDocumentUrl ? (
                    <a
                      href={dossierDoctor.licenseDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-deep-ink inline-flex items-center gap-1 font-semibold hover:underline"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Download Credential File</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate/60 italic">
                      No document uploaded
                    </span>
                  )}
                </div>
              </div>

              {/* Audit history */}
              {dossierDoctor.verifiedAt && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-emerald-950">
                  <span className="block font-bold text-emerald-900">
                    Verified Record:
                  </span>
                  <span>
                    Certified on{' '}
                    {new Date(dossierDoctor.verifiedAt).toLocaleString()} by{' '}
                    {dossierDoctor.verifiedBy || 'Administrator'}.
                  </span>
                </div>
              )}

              {dossierDoctor.rejectionReason && (
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-4 text-rose-950">
                  <span className="block font-bold text-rose-900">
                    Rejection / Revocation Record:
                  </span>
                  <span className="mt-1 block leading-relaxed">
                    {dossierDoctor.rejectionReason}
                  </span>
                </div>
              )}
            </div>

            {/* Actions in dossier */}
            <div className="border-deep-ink/8 flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDossierDoctor(null)}
                className="border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-soft-meadow rounded-xl"
              >
                Close Dossier
              </Button>

              <div className="flex gap-2">
                {dossierDoctor.verificationStatus !== 'verified' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovingDoctor(dossierDoctor);
                    }}
                    className="bg-deep-ink hover:bg-deep-ink/90 cursor-pointer gap-1.5 rounded-xl text-xs font-semibold text-white shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Approve Clinician</span>
                  </Button>
                )}

                {dossierDoctor.verificationStatus === 'verified' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRevokingDoctor(dossierDoctor);
                      setRejectionReason('');
                    }}
                    className="cursor-pointer gap-1.5 rounded-xl border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-50"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Revoke Privileges</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Native Role-Aware Bottom Navigation */}
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
