'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/navigation/bottom-nav'

interface DoctorItem {
  id: string
  name: string
  email: string
  specialty: string
  license: string
  issuingAuthority: string | null
  licenseDocumentUrl: string | null
  clinic: string
  careCode: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verifiedAt: number | null
  verifiedBy: string | null
  rejectionReason: string | null
  phone: string | null
  createdAt: number
  updatedAt?: number
}

interface AdminUser {
  id?: string
  name?: string
  email?: string
  userType?: string
}

const REJECTION_PRESETS = [
  'Medical credentials could not be verified on the state medical board registry.',
  'Submitted medical license or credentials appear to be expired or invalid.',
  'Incomplete documentation: Medical license certificate could not be validated.',
  'Clinic affiliation and primary practice address could not be confirmed.',
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<DoctorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Admin user details
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)

  // Modals state
  const [approvingDoctor, setApprovingDoctor] = useState<DoctorItem | null>(null)
  const [rejectionModalDoctor, setRejectionModalDoctor] = useState<DoctorItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [revokingDoctor, setRevokingDoctor] = useState<DoctorItem | null>(null)
  const [dossierDoctor, setDossierDoctor] = useState<DoctorItem | null>(null)

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  // Auto-dismiss notifications after 6s
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => {
      setNotification(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [notification])

  // Fetch current admin user profile
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            setAdminUser(data.user)
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    void fetchMe()
  }, [])

  const fetchDoctors = async () => {
    try {
      setRefreshing(true)
      // Fetch full directory so metric counts remain persistent & accurate across all tabs
      const res = await fetch('/api/admin/doctors')

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?from=/dashboard/admin')
        return
      }

      const data = await res.json()
      if (data.success && Array.isArray(data.doctors)) {
        setDoctors(data.doctors)
        setLastUpdated(new Date())
      } else {
        throw new Error(data.message || 'Failed to load clinicians')
      }
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err)
      setNotification({
        type: 'error',
        message: err.message || 'Failed to load clinicians registry. Please check network connection.',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchDoctors()
  }, [])

  // Calculate accurate global counts regardless of current tab or search
  const counts = useMemo(() => {
    return {
      pending: doctors.filter(d => (d.verificationStatus || 'pending') === 'pending').length,
      verified: doctors.filter(d => d.verificationStatus === 'verified').length,
      rejected: doctors.filter(d => d.verificationStatus === 'rejected').length,
      total: doctors.length,
    }
  }, [doctors])

  // Extract unique specialties for filtering
  const specialties = useMemo(() => {
    const set = new Set<string>()
    doctors.forEach(d => {
      if (d.specialty) set.add(d.specialty)
    })
    return Array.from(set).sort()
  }, [doctors])

  // Filter and sort clinicians
  const filteredDoctors = useMemo(() => {
    return doctors
      .filter(doc => {
        const status = doc.verificationStatus || 'pending'
        const matchesTab = activeTab === 'all' || status === activeTab

        const query = searchQuery.trim().toLowerCase()
        const matchesSearch =
          !query ||
          doc.name.toLowerCase().includes(query) ||
          doc.email.toLowerCase().includes(query) ||
          doc.clinic.toLowerCase().includes(query) ||
          doc.license.toLowerCase().includes(query) ||
          doc.careCode.toLowerCase().includes(query) ||
          doc.specialty.toLowerCase().includes(query) ||
          (doc.issuingAuthority && doc.issuingAuthority.toLowerCase().includes(query))

        const matchesSpecialty =
          specialtyFilter === 'all' || doc.specialty.toLowerCase() === specialtyFilter.toLowerCase()

        return matchesTab && matchesSearch && matchesSpecialty
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return (b.createdAt || 0) - (a.createdAt || 0)
        }
        if (sortBy === 'oldest') {
          return (a.createdAt || 0) - (b.createdAt || 0)
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        }
        return 0
      })
  }, [doctors, activeTab, searchQuery, specialtyFilter, sortBy])

  const handleApprove = async (doctor: DoctorItem) => {
    setActionLoadingId(doctor.id)
    setNotification(null)

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Verification approval failed.')
      }

      setNotification({
        type: 'success',
        message: `Dr. ${doctor.name} was successfully verified and granted clinical privileges.`,
      })
      setApprovingDoctor(null)
      if (dossierDoctor?.id === doctor.id) {
        setDossierDoctor(null)
      }
      await fetchDoctors()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to approve clinician verification.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async () => {
    const targetDoctor = rejectionModalDoctor || revokingDoctor
    if (!targetDoctor) return

    setActionLoadingId(targetDoctor.id)
    setNotification(null)

    const finalReason =
      rejectionReason.trim() || 'Medical credentials could not be verified with the issuing authority.'

    try {
      const res = await fetch(`/api/admin/doctors/${targetDoctor.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Status revocation failed.')
      }

      setNotification({
        type: 'success',
        message: `Clinical privileges for Dr. ${targetDoctor.name} have been revoked.`,
      })
      setRejectionModalDoctor(null)
      setRevokingDoctor(null)
      setRejectionReason('')
      if (dossierDoctor?.id === targetDoctor.id) {
        setDossierDoctor(null)
      }
      await fetchDoctors()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to revoke clinician status.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleExportCSV = () => {
    if (doctors.length === 0) return

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
    ]

    const rows = doctors.map(doc => [
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
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `noa-clinician-verification-audit-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setNotification({
      type: 'info',
      message: `Exported ${doctors.length} clinician records to CSV for clinical governance audit.`,
    })
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

  const getDoctorInitials = (name: string) => {
    const clean = name.replace(/^dr\.?\s+/i, '').trim()
    const parts = clean.split(' ').filter(Boolean)
    if (parts.length === 0) return 'MD'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex flex-col font-sans antialiased selection:bg-hi-yellow selection:text-deep-ink">
      {/* Top Admin Navigation Header (Harmonized with Noa Brand) */}
      <header className="bg-white/85 backdrop-blur-md border-b border-deep-ink/10 sticky top-0 z-30 px-4 sm:px-8 py-3.5 transition-shadow">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Brand & Console Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Noa Logo" className="w-9 h-9 rounded-xl shadow-2xs shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif font-bold text-deep-ink tracking-tight text-xl">Noa</span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-soft-meadow text-deep-ink rounded-full border border-deep-ink/10">
                  Superadmin Console
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-medium bg-canvas text-deep-ink/80 rounded-full border border-deep-ink/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Clinical Governance Gateway
                </span>
              </div>
              <p className="text-xs text-slate mt-0.5 font-medium">Clinician Verification & Medical Practice Governance</p>
            </div>
          </div>

          {/* Right Controls: User Profile, CSV Export, Refresh, Logout */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            {/* Admin identity pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-soft-meadow rounded-xl border border-deep-ink/10 text-xs">
              <div className="w-6 h-6 rounded-full bg-white text-deep-ink font-serif font-bold flex items-center justify-center text-[10px] border border-deep-ink/10">
                {adminUser?.name ? getDoctorInitials(adminUser.name) : 'SA'}
              </div>
              <div className="text-left">
                <span className="font-semibold text-deep-ink block truncate max-w-[130px]">
                  {adminUser?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-slate block">Admins Cognito Group</span>
              </div>
            </div>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading || doctors.length === 0}
              className="gap-1.5 text-xs text-deep-ink border-deep-ink/10 bg-white hover:bg-soft-meadow h-9 shadow-editorial"
              title="Download full clinician audit log as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate" />
              <span className="hidden sm:inline">Export Audit</span>
            </Button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDoctors}
              disabled={refreshing}
              className="gap-1.5 text-xs text-deep-ink border-deep-ink/10 bg-white hover:bg-soft-meadow h-9 shadow-editorial"
              title={`Last refreshed: ${lastUpdated.toLocaleTimeString()}`}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate', refreshing && 'animate-spin text-deep-ink')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28 lg:pb-8">
        {/* Notification Banner with Smooth Presentation */}
        {notification && (
          <div
            className={cn(
              'p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs border transition-all animate-in fade-in slide-in-from-top-2 break-words',
              notification.type === 'success' && 'bg-emerald-50 text-emerald-900 border-emerald-200',
              notification.type === 'error' && 'bg-rose-50 text-rose-900 border-rose-200',
              notification.type === 'info' && 'bg-teal-50 text-teal-900 border-teal-200'
            )}
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {notification.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {notification.type === 'error' && (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              {notification.type === 'info' && (
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs tracking-wide uppercase opacity-80">
                  {notification.type === 'success' ? 'Action Completed' : notification.type === 'error' ? 'Validation Notice' : 'System Notice'}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed break-words">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-black/5 cursor-pointer transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Executive KPI Metric Cards (Compact 2x2 on Mobile, 4 columns on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Pending */}
          <div
            onClick={() => setActiveTab('pending')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group shadow-editorial',
              activeTab === 'pending'
                ? 'border-deep-ink ring-2 ring-deep-ink/10 shadow-editorial-elevated bg-amber-50/20'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate truncate">
                Pending Review
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-medium font-serif text-deep-ink">{counts.pending}</span>
              {counts.pending > 0 && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-900 bg-amber-200/50 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full border border-amber-300/40">
                  Action
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate truncate">Awaiting review</p>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-deep-ink" />
            )}
          </div>

          {/* Card 2: Verified */}
          <div
            onClick={() => setActiveTab('verified')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group shadow-editorial',
              activeTab === 'verified'
                ? 'border-deep-ink ring-2 ring-deep-ink/10 shadow-editorial-elevated bg-emerald-50/20'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate truncate">
                Verified
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-medium font-serif text-deep-ink">{counts.verified}</span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate truncate">Active licensed</p>
            {activeTab === 'verified' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-deep-ink" />
            )}
          </div>

          {/* Card 3: Rejected */}
          <div
            onClick={() => setActiveTab('rejected')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group shadow-editorial',
              activeTab === 'rejected'
                ? 'border-deep-ink ring-2 ring-deep-ink/10 shadow-editorial-elevated bg-rose-50/20'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate truncate">
                Revoked
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100/80 text-rose-800 flex items-center justify-center shrink-0">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-medium font-serif text-deep-ink">{counts.rejected}</span>
              {counts.rejected > 0 && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-rose-800 bg-rose-100 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full border border-rose-200">
                  Restricted
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate truncate">Revoked access</p>
            {activeTab === 'rejected' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-deep-ink" />
            )}
          </div>

          {/* Card 4: Total */}
          <div
            onClick={() => setActiveTab('all')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group shadow-editorial',
              activeTab === 'all'
                ? 'border-deep-ink ring-2 ring-deep-ink/10 shadow-editorial-elevated bg-soft-meadow/40'
                : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate truncate">
                Total
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-soft-meadow text-deep-ink flex items-center justify-center shrink-0 border border-deep-ink/10">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-medium font-serif text-deep-ink">{counts.total}</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate bg-soft-meadow px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full border border-deep-ink/10">
                All
              </span>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate truncate">All clinicians</p>
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-deep-ink" />
            )}
          </div>
        </div>

        {/* Command Toolbar: Search, Specialty Filter, Sort, Status Segmented Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-deep-ink/8 shadow-editorial space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input
                type="text"
                placeholder="Search by name, email, clinic, license #, or care code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-deep-ink/10 bg-canvas text-sm focus:outline-none focus:ring-2 focus:ring-deep-ink/20 focus:bg-white transition-all text-deep-ink placeholder:text-slate/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-deep-ink p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter and Sort Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Specialty Dropdown */}
              {specialties.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate">
                  <select
                    value={specialtyFilter}
                    onChange={e => setSpecialtyFilter(e.target.value)}
                    aria-label="Filter by specialty"
                    className="px-3 py-2 rounded-xl border border-deep-ink/10 bg-canvas text-xs text-deep-ink focus:outline-none focus:ring-2 focus:ring-deep-ink/20 cursor-pointer"
                  >
                    <option value="all">All Specialties</option>
                    {specialties.map(spec => (
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
                onChange={e => setSortBy(e.target.value as any)}
                aria-label="Sort order"
                className="px-3 py-2 rounded-xl border border-deep-ink/10 bg-canvas text-xs text-deep-ink focus:outline-none focus:ring-2 focus:ring-deep-ink/20 cursor-pointer"
              >
                <option value="newest">Newest Registered</option>
                <option value="oldest">Oldest Registered</option>
                <option value="name">Name (A-Z)</option>
              </select>

              {/* Segmented Status Tabs */}
              <div className="flex gap-1 p-1 bg-soft-meadow rounded-xl border border-deep-ink/8 overflow-x-auto scrollbar-none w-full sm:w-auto">
                {(
                  [
                    { id: 'pending', label: 'Pending', count: counts.pending },
                    { id: 'verified', label: 'Verified', count: counts.verified },
                    { id: 'rejected', label: 'Rejected', count: counts.rejected },
                    { id: 'all', label: 'All', count: counts.total },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                      activeTab === tab.id
                        ? 'bg-white text-deep-ink shadow-2xs font-semibold border border-deep-ink/8'
                        : 'text-slate hover:text-deep-ink'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px]',
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
          <div className="flex items-center justify-between text-xs text-slate pt-1 border-t border-deep-ink/6">
            <span>
              Showing <strong className="text-deep-ink">{filteredDoctors.length}</strong>{' '}
              {filteredDoctors.length === 1 ? 'clinician' : 'clinicians'}
              {searchQuery && ` matching "${searchQuery}"`}
              {activeTab !== 'all' && ` with status "${activeTab}"`}
            </span>
            {(searchQuery || specialtyFilter !== 'all' || activeTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSpecialtyFilter('all')
                  setActiveTab('all')
                }}
                className="text-deep-ink font-semibold underline underline-offset-2 hover:opacity-75 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Clinicians Registry List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            /* Skeleton Loading State */
            <div className="p-8 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex flex-col md:flex-row gap-4 justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-44 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <div className="h-3 bg-slate-100 rounded" />
                      <div className="h-3 bg-slate-100 rounded" />
                      <div className="h-3 bg-slate-100 rounded" />
                      <div className="h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                    <div className="h-8 w-20 bg-slate-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDoctors.length === 0 ? (
            /* Enhanced Empty State */
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-slate-800 text-lg">No clinicians found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchQuery || specialtyFilter !== 'all'
                  ? 'No practitioner profiles match your current search query or specialty filter.'
                  : activeTab === 'pending'
                  ? 'Great job! All submitted clinician registrations have been fully reviewed and verified.'
                  : `There are currently no clinicians with the status "${activeTab}".`}
              </p>
              {(searchQuery || specialtyFilter !== 'all' || activeTab !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSpecialtyFilter('all')
                    setActiveTab('all')
                  }}
                  className="mt-2 text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            /* Clinician Dossier Cards */
            <div className="divide-y divide-deep-ink/5">
              {filteredDoctors.map(doctor => {
                const status = doctor.verificationStatus || 'pending'
                const isPending = status === 'pending'
                const isVerified = status === 'verified'
                const isRejected = status === 'rejected'

                return (
                  <div
                    key={doctor.id}
                    className="p-4 sm:p-6 hover:bg-soft-meadow/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6"
                  >
                    {/* Left Clinician Identity & Metadata */}
                    <div className="space-y-3.5 flex-1 min-w-0">
                      {/* Name, Status Badge, Care Code, Email */}
                      <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
                        {/* Avatar */}
                        <div
                          className={cn(
                            'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold font-serif text-sm shrink-0 border shadow-2xs',
                            isVerified && 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                            isPending && 'bg-amber-50 text-amber-900 border-amber-200/80',
                            isRejected && 'bg-rose-50 text-rose-900 border-rose-200/80'
                          )}
                        >
                          {getDoctorInitials(doctor.name)}
                        </div>

                        {/* Name & Badges */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="text-base font-bold font-serif text-deep-ink tracking-tight">
                              Dr. {doctor.name.replace(/^dr\.?\s+/i, '')}
                            </h3>

                            {/* Status badge */}
                            <span
                              className={cn(
                                'px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 border shrink-0',
                                isVerified && 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                                isPending && 'bg-amber-50 text-amber-900 border-amber-200/80',
                                isRejected && 'bg-rose-50 text-rose-900 border-rose-200/80'
                              )}
                            >
                              {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                              {isPending && <Clock className="w-3 h-3 text-amber-700" />}
                              {isRejected && <XCircle className="w-3 h-3 text-rose-700" />}
                              <span className="capitalize">{status}</span>
                            </span>

                            {/* Care Code with 1-Click Copy */}
                            <button
                              onClick={() => handleCopy(doctor.careCode, `code-${doctor.id}`)}
                              className="text-xs font-mono bg-soft-meadow text-deep-ink px-2 py-0.5 rounded-md border border-deep-ink/10 flex items-center gap-1 hover:bg-soft-meadow/80 transition-colors cursor-pointer shrink-0 font-semibold"
                              title="Click to copy care code"
                            >
                              <span>{doctor.careCode}</span>
                              {copiedCode === `code-${doctor.id}` ? (
                                <Check className="w-3 h-3 text-emerald-700" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <Mail className="w-3 h-3 text-slate/70 shrink-0" />
                              <span className="text-deep-ink font-medium break-all">{doctor.email}</span>
                            </span>
                            {doctor.phone && (
                              <span className="inline-flex items-center gap-1 shrink-0">
                                <Phone className="w-3 h-3 text-slate/70" />
                                <span>{doctor.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credential Data Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2.5 gap-x-4 sm:gap-x-6 text-xs bg-soft-meadow/50 p-3 sm:p-3.5 rounded-xl border border-deep-ink/8">
                        <div>
                          <span className="text-slate font-medium block text-[11px]">Specialty</span>
                          <span className="font-semibold text-deep-ink">{doctor.specialty || 'General Practice'}</span>
                        </div>
                        <div>
                          <span className="text-slate font-medium block text-[11px]">Clinic Affiliation</span>
                          <span className="font-semibold text-deep-ink truncate block" title={doctor.clinic}>
                            {doctor.clinic || 'Independent Practice'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate font-medium block text-[11px]">Medical License #</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-deep-ink bg-white px-1.5 py-0.5 rounded border border-deep-ink/10 break-all text-xs">
                              {doctor.license}
                            </span>
                            {/* Medical board lookup link */}
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(
                                `medical license registry verification "${doctor.license}" "${doctor.name}"`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-deep-ink hover:text-slate font-medium hover:underline inline-flex items-center gap-0.5 text-[11px] shrink-0"
                              title="Search state medical registry"
                            >
                              <span>Verify Board</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate font-medium block text-[11px]">Issuing Authority</span>
                          <span className="text-deep-ink/80 font-medium truncate block">
                            {doctor.issuingAuthority || 'State Medical Board'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate font-medium block text-[11px]">Registered Date</span>
                          <span className="text-deep-ink/80">
                            {new Date(doctor.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate font-medium block text-[11px]">License Documentation</span>
                          {doctor.licenseDocumentUrl ? (
                            <a
                              href={doctor.licenseDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-deep-ink font-semibold underline underline-offset-2 hover:text-slate inline-flex items-center gap-1 shrink-0"
                            >
                              <FileCheck className="w-3 h-3 text-deep-ink/70" />
                              <span>View Certificate</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-slate/60 italic">Self-attested (no file)</span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Note if applicable */}
                      {doctor.rejectionReason && (
                        <div className="text-xs text-rose-950 bg-rose-50/90 p-3 rounded-xl border border-rose-200/80 flex items-start gap-2 break-words">
                          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold block text-rose-900">Credential Revocation Reason:</span>
                            <span className="leading-relaxed break-words">{doctor.rejectionReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Verification Audit Note if verified */}
                      {isVerified && doctor.verifiedAt && (
                        <div className="text-[11px] text-slate flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            Verified on{' '}
                            {new Date(doctor.verifiedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            by {doctor.verifiedBy || 'Superadministrator'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Governance Actions (Full width on mobile, right-aligned on desktop) */}
                    <div className="w-full lg:w-auto flex items-center justify-stretch sm:justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-deep-ink/8 flex-wrap sm:flex-nowrap">
                      {/* View Full Dossier */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDossierDoctor(doctor)}
                        className="flex-1 sm:flex-initial justify-center min-h-[38px] text-xs text-deep-ink hover:text-deep-ink hover:bg-soft-meadow border border-deep-ink/10 gap-1 rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate" />
                        <span>Dossier</span>
                      </Button>

                      {/* Pending: Approve & Reject buttons */}
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setApprovingDoctor(doctor)}
                            disabled={actionLoadingId === doctor.id}
                            className="flex-1 sm:flex-initial justify-center min-h-[38px] bg-deep-ink hover:bg-deep-ink/90 text-white shadow-xs gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Approve</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectionModalDoctor(doctor)
                              setRejectionReason('')
                            }}
                            disabled={actionLoadingId === doctor.id}
                            className="flex-1 sm:flex-initial justify-center min-h-[38px] border-rose-200/90 text-rose-800 hover:bg-rose-50 hover:border-rose-300 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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
                          className="flex-1 sm:flex-initial justify-center min-h-[38px] text-deep-ink border-deep-ink/20 hover:bg-soft-meadow gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Re-Verify</span>
                        </Button>
                      )}

                      {/* Verified: Revoke Access button */}
                      {isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRevokingDoctor(doctor)
                            setRejectionReason('')
                          }}
                          disabled={actionLoadingId === doctor.id}
                          className="flex-1 sm:flex-initial justify-center min-h-[38px] text-slate border-deep-ink/10 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 text-xs gap-1 rounded-xl cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Approval Confirmation Modal */}
      {approvingDoctor && (
        <div className="fixed inset-0 z-50 bg-deep-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-editorial-elevated border border-deep-ink/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-deep-ink">Grant Clinical Practice Privileges</h3>
                <p className="text-xs text-slate">Dr. {approvingDoctor.name}</p>
              </div>
            </div>

            <div className="p-3.5 bg-soft-meadow/70 rounded-xl border border-deep-ink/8 text-xs space-y-1.5 text-deep-ink">
              <div className="flex justify-between">
                <span className="text-slate">Email:</span>
                <span className="font-medium">{approvingDoctor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">License Number:</span>
                <span className="font-mono font-bold text-deep-ink">{approvingDoctor.license}</span>
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

            <div className="text-xs text-slate leading-relaxed space-y-1">
              <p>
                Approving this clinician will assign their Cognito account to the <strong>Doctors</strong> security group,
                enabling full access to patient health records, live clinical sessions, and prescription creation.
              </p>
              <p className="text-emerald-800 font-medium">
                An audit entry will be permanently logged in DynamoDB with your Administrator ID.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-deep-ink/8">
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
                className="bg-deep-ink hover:bg-deep-ink/90 text-white font-semibold gap-1.5 rounded-xl cursor-pointer"
              >
                {actionLoadingId === approvingDoctor.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
        <div className="fixed inset-0 z-50 bg-deep-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-editorial-elevated border border-deep-ink/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/80 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-deep-ink">
                  {revokingDoctor ? 'Revoke Clinical Privileges' : 'Reject Clinician Application'}
                </h3>
                <p className="text-xs text-slate">
                  Dr. {(rejectionModalDoctor || revokingDoctor)?.name} ({ (rejectionModalDoctor || revokingDoctor)?.email })
                </p>
              </div>
            </div>

            <p className="text-xs text-slate leading-relaxed">
              Select or specify why this clinician cannot be certified. This notice will be recorded in the clinical
              governance audit trail and revoke active privileges.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
                Common Administrative Reasons:
              </span>
              <div className="space-y-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={cn(
                      'w-full text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer block',
                      rejectionReason === preset
                        ? 'bg-rose-50 text-rose-950 border-rose-300 font-medium'
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
              <label className="text-xs font-semibold text-deep-ink">Detailed Feedback / Notes:</label>
              <textarea
                rows={3}
                placeholder="Enter specific audit findings or state medical board reference..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-deep-ink/15 text-xs focus:outline-none focus:ring-2 focus:ring-deep-ink/20 focus:border-deep-ink bg-canvas text-deep-ink"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-deep-ink/8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectionModalDoctor(null)
                  setRevokingDoctor(null)
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
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 rounded-xl cursor-pointer"
              >
                {actionLoadingId !== null ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{revokingDoctor ? 'Confirm Revocation' : 'Confirm Rejection'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Clinician Full Dossier Modal */}
      {dossierDoctor && (
        <div className="fixed inset-0 z-50 bg-deep-ink/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-editorial-elevated border border-deep-ink/10 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-soft-meadow text-deep-ink font-bold font-serif text-base flex items-center justify-center border border-deep-ink/10">
                  {getDoctorInitials(dossierDoctor.name)}
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif text-deep-ink">Dr. {dossierDoctor.name}</h2>
                  <p className="text-xs text-slate">Care Code: {dossierDoctor.careCode} • {dossierDoctor.clinic}</p>
                </div>
              </div>
              <button
                onClick={() => setDossierDoctor(null)}
                className="text-slate hover:text-deep-ink p-1.5 rounded-lg hover:bg-soft-meadow cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-soft-meadow/60 border border-deep-ink/8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate uppercase tracking-wider">Status:</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border',
                    dossierDoctor.verificationStatus === 'verified' && 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                    dossierDoctor.verificationStatus === 'pending' && 'bg-amber-50 text-amber-900 border-amber-200/80',
                    dossierDoctor.verificationStatus === 'rejected' && 'bg-rose-50 text-rose-900 border-rose-200/80'
                  )}
                >
                  {dossierDoctor.verificationStatus}
                </span>
              </div>
              <span className="text-xs text-slate">
                Registered: {new Date(dossierDoctor.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Dossier sections */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-deep-ink uppercase tracking-wider text-[11px]">Contact & Clinic Details</h4>
              <div className="grid grid-cols-2 gap-4 bg-soft-meadow/40 p-4 rounded-xl border border-deep-ink/8">
                <div>
                  <span className="text-slate block font-medium">Full Legal Name</span>
                  <span className="font-semibold text-deep-ink">{dossierDoctor.name}</span>
                </div>
                <div>
                  <span className="text-slate block font-medium">Primary Email</span>
                  <span className="font-semibold text-deep-ink">{dossierDoctor.email}</span>
                </div>
                <div>
                  <span className="text-slate block font-medium">Specialty Practice</span>
                  <span className="font-semibold text-deep-ink">{dossierDoctor.specialty}</span>
                </div>
                <div>
                  <span className="text-slate block font-medium">Affiliated Health Clinic</span>
                  <span className="font-semibold text-deep-ink">{dossierDoctor.clinic}</span>
                </div>
              </div>

              <h4 className="font-bold text-deep-ink uppercase tracking-wider text-[11px]">Licensure Credentials</h4>
              <div className="grid grid-cols-2 gap-4 bg-soft-meadow/40 p-4 rounded-xl border border-deep-ink/8">
                <div>
                  <span className="text-slate block font-medium">License / NPI Number</span>
                  <span className="font-mono font-bold text-deep-ink text-sm">{dossierDoctor.license}</span>
                </div>
                <div>
                  <span className="text-slate block font-medium">Issuing Board Authority</span>
                  <span className="font-semibold text-deep-ink">{dossierDoctor.issuingAuthority || 'State Board'}</span>
                </div>
                <div>
                  <span className="text-slate block font-medium">Official Registry Lookup</span>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `medical board license verification "${dossierDoctor.license}" "${dossierDoctor.name}"`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-deep-ink font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Check State Registry</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate block font-medium">Certificate Document</span>
                  {dossierDoctor.licenseDocumentUrl ? (
                    <a
                      href={dossierDoctor.licenseDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-deep-ink font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Download Credential File</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate/60 italic">No document uploaded</span>
                  )}
                </div>
              </div>

              {/* Audit history */}
              {dossierDoctor.verifiedAt && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
                  <span className="font-bold block text-emerald-900">Verified Record:</span>
                  <span>
                    Certified on {new Date(dossierDoctor.verifiedAt).toLocaleString()} by {dossierDoctor.verifiedBy || 'Administrator'}.
                  </span>
                </div>
              )}

              {dossierDoctor.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-950">
                  <span className="font-bold block text-rose-900">Rejection / Revocation Record:</span>
                  <span className="mt-1 block leading-relaxed">{dossierDoctor.rejectionReason}</span>
                </div>
              )}
            </div>

            {/* Actions in dossier */}
            <div className="flex justify-between items-center pt-4 border-t border-deep-ink/8">
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
                      setApprovingDoctor(dossierDoctor)
                    }}
                    className="bg-deep-ink hover:bg-deep-ink/90 text-white font-semibold text-xs gap-1.5 rounded-xl cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve Clinician</span>
                  </Button>
                )}

                {dossierDoctor.verificationStatus === 'verified' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRevokingDoctor(dossierDoctor)
                      setRejectionReason('')
                    }}
                    className="text-rose-800 border-rose-200 hover:bg-rose-50 text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
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
        onTabChange={tabId => setActiveTab(tabId as any)}
        badgeCounts={{
          pending: counts.pending > 0 ? counts.pending : undefined,
          verified: counts.verified > 0 ? counts.verified : undefined,
          rejected: counts.rejected > 0 ? counts.rejected : undefined,
          all: counts.total > 0 ? counts.total : undefined,
        }}
        className="lg:hidden"
      />
    </div>
  )
}
