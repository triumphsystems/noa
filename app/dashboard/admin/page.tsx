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
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Admin Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 transition-shadow">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Brand & Console Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-xs ring-1 ring-teal-700/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-slate-900 tracking-tight text-lg">Noa</span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-800 rounded-full border border-teal-200/80">
                  Superadmin Console
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Clinician Verification & Medical Practice Governance</p>
            </div>
          </div>

          {/* Right Controls: User Profile, CSV Export, Refresh, Logout */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            {/* Admin identity pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                {adminUser?.name ? getDoctorInitials(adminUser.name) : 'SA'}
              </div>
              <div className="text-left">
                <span className="font-semibold text-slate-800 block truncate max-w-[130px]">
                  {adminUser?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-slate-500 block">Admins Cognito Group</span>
              </div>
            </div>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading || doctors.length === 0}
              className="gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 h-9"
              title="Download full clinician audit log as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export Audit</span>
            </Button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDoctors}
              disabled={refreshing}
              className="gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 h-9"
              title={`Last refreshed: ${lastUpdated.toLocaleTimeString()}`}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', refreshing && 'animate-spin text-teal-600')} />
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Notification Banner with Smooth Presentation */}
        {notification && (
          <div
            className={cn(
              'p-4 rounded-xl text-sm flex items-start justify-between gap-3 shadow-xs border transition-all animate-in fade-in slide-in-from-top-2',
              notification.type === 'success' && 'bg-emerald-50 text-emerald-900 border-emerald-200',
              notification.type === 'error' && 'bg-rose-50 text-rose-900 border-rose-200',
              notification.type === 'info' && 'bg-teal-50 text-teal-900 border-teal-200'
            )}
          >
            <div className="flex items-start gap-2.5">
              {notification.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {notification.type === 'error' && (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              {notification.type === 'info' && (
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-xs tracking-wide uppercase opacity-80">
                  {notification.type === 'success' ? 'Action Completed' : notification.type === 'error' ? 'Validation Notice' : 'System Notice'}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-black/5 cursor-pointer transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pending */}
          <div
            onClick={() => setActiveTab('pending')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group',
              activeTab === 'pending'
                ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20 bg-amber-50/20'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Review
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-slate-900">{counts.pending}</span>
              {counts.pending > 0 && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Awaiting medical credential check</p>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            )}
          </div>

          {/* Card 2: Verified */}
          <div
            onClick={() => setActiveTab('verified')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group',
              activeTab === 'verified'
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20 bg-emerald-50/20'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Verified Clinicians
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-slate-900">{counts.verified}</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Active licensed practice privileges</p>
            {activeTab === 'verified' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
            )}
          </div>

          {/* Card 3: Rejected */}
          <div
            onClick={() => setActiveTab('rejected')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group',
              activeTab === 'rejected'
                ? 'border-rose-400 shadow-md ring-2 ring-rose-400/20 bg-rose-50/20'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rejected / Revoked
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-slate-900">{counts.rejected}</span>
              {counts.rejected > 0 && (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                  Restricted
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Revoked or denied clinical privileges</p>
            {activeTab === 'rejected' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
            )}
          </div>

          {/* Card 4: Total */}
          <div
            onClick={() => setActiveTab('all')}
            role="button"
            tabIndex={0}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white text-left relative overflow-hidden group',
              activeTab === 'all'
                ? 'border-teal-600 shadow-md ring-2 ring-teal-600/20 bg-teal-50/20'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Practitioners
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-slate-900">{counts.total}</span>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                All Records
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Registered across healthcare centers</p>
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600" />
            )}
          </div>
        </div>

        {/* Command Toolbar: Search, Specialty Filter, Sort, Status Segmented Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, clinic, license #, or care code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/40 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
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
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <select
                    value={specialtyFilter}
                    onChange={e => setSpecialtyFilter(e.target.value)}
                    aria-label="Filter by specialty"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/40 cursor-pointer"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/40 cursor-pointer"
              >
                <option value="newest">Newest Registered</option>
                <option value="oldest">Oldest Registered</option>
                <option value="name">Name (A-Z)</option>
              </select>

              {/* Segmented Status Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
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
                      'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5',
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px]',
                        activeTab === tab.id
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-slate-200/70 text-slate-600'
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
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing <strong className="text-slate-800">{filteredDoctors.length}</strong>{' '}
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
                className="text-teal-700 hover:underline cursor-pointer font-medium"
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
            <div className="divide-y divide-slate-100">
              {filteredDoctors.map(doctor => {
                const status = doctor.verificationStatus || 'pending'
                const isPending = status === 'pending'
                const isVerified = status === 'verified'
                const isRejected = status === 'rejected'

                return (
                  <div
                    key={doctor.id}
                    className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    {/* Left Clinician Identity & Metadata */}
                    <div className="space-y-3.5 flex-1 min-w-0">
                      {/* Name, Status Badge, Care Code, Email */}
                      <div className="flex items-center gap-3.5 flex-wrap">
                        {/* Avatar */}
                        <div
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center font-bold font-serif text-sm shrink-0 border shadow-2xs',
                            isVerified && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            isPending && 'bg-amber-50 text-amber-800 border-amber-200',
                            isRejected && 'bg-rose-50 text-rose-800 border-rose-200'
                          )}
                        >
                          {getDoctorInitials(doctor.name)}
                        </div>

                        {/* Name & Badges */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold font-serif text-slate-900 tracking-tight">
                              Dr. {doctor.name.replace(/^dr\.?\s+/i, '')}
                            </h3>

                            {/* Status badge */}
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border',
                                isVerified && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                isPending && 'bg-amber-50 text-amber-700 border-amber-200',
                                isRejected && 'bg-rose-50 text-rose-700 border-rose-200'
                              )}
                            >
                              {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                              {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                              <span className="capitalize">{status}</span>
                            </span>

                            {/* Care Code with 1-Click Copy */}
                            <button
                              onClick={() => handleCopy(doctor.careCode, `code-${doctor.id}`)}
                              className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 hover:bg-slate-200/80 transition-colors cursor-pointer"
                              title="Click to copy care code"
                            >
                              <span>{doctor.careCode}</span>
                              {copiedCode === `code-${doctor.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-700 font-medium">{doctor.email}</span>
                            </span>
                            {doctor.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{doctor.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credential Data Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 font-medium block">Specialty</span>
                          <span className="font-semibold text-slate-800">{doctor.specialty || 'General Practice'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Clinic Affiliation</span>
                          <span className="font-semibold text-slate-800 truncate block" title={doctor.clinic}>
                            {doctor.clinic || 'Independent Practice'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Medical License #</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {doctor.license}
                            </span>
                            {/* Medical board lookup link */}
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(
                                `medical license registry verification "${doctor.license}" "${doctor.name}"`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                              title="Search state medical registry"
                            >
                              <span>Verify Board</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium block">Issuing Authority</span>
                          <span className="text-slate-700 font-medium">
                            {doctor.issuingAuthority || 'State Medical Board'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium block">Registered Date</span>
                          <span className="text-slate-700">
                            {new Date(doctor.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium block">License Documentation</span>
                          {doctor.licenseDocumentUrl ? (
                            <a
                              href={doctor.licenseDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-700 font-semibold underline underline-offset-2 hover:text-teal-900 inline-flex items-center gap-1"
                            >
                              <FileCheck className="w-3 h-3 text-teal-600" />
                              <span>View Certificate</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Self-attested (no file)</span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Note if applicable */}
                      {doctor.rejectionReason && (
                        <div className="text-xs text-rose-800 bg-rose-50/80 p-3 rounded-xl border border-rose-200/70 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Credential Revocation Reason:</span>
                            <span className="leading-relaxed">{doctor.rejectionReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Verification Audit Note if verified */}
                      {isVerified && doctor.verifiedAt && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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

                    {/* Right Governance Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                      {/* View Full Dossier */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDossierDoctor(doctor)}
                        className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </Button>

                      {/* Pending: Approve & Reject buttons */}
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setApprovingDoctor(doctor)}
                            disabled={actionLoadingId === doctor.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-semibold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
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
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 gap-1.5 text-xs font-semibold"
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
                          className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
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
                          className="text-slate-500 border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs gap-1"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-slate-900">Grant Clinical Practice Privileges</h3>
                <p className="text-xs text-slate-500">Dr. {approvingDoctor.name}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium">{approvingDoctor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">License Number:</span>
                <span className="font-mono font-bold text-slate-800">{approvingDoctor.license}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Specialty:</span>
                <span className="font-medium">{approvingDoctor.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clinic:</span>
                <span className="font-medium">{approvingDoctor.clinic}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-1">
              <p>
                Approving this clinician will assign their Cognito account to the <strong>Doctors</strong> security group,
                enabling full access to patient health records, live clinical sessions, and prescription creation.
              </p>
              <p className="text-emerald-700 font-medium">
                An audit entry will be permanently logged in DynamoDB with your Administrator ID.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingDoctor(null)}
                disabled={actionLoadingId !== null}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(approvingDoctor)}
                disabled={actionLoadingId !== null}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                {actionLoadingId === approvingDoctor.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-slate-900">
                  {revokingDoctor ? 'Revoke Clinical Privileges' : 'Reject Clinician Application'}
                </h3>
                <p className="text-xs text-slate-500">
                  Dr. {(rejectionModalDoctor || revokingDoctor)?.name} ({ (rejectionModalDoctor || revokingDoctor)?.email })
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select or specify why this clinician cannot be certified. This notice will be recorded in the clinical
              governance audit trail and revoke active privileges.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Common Administrative Reasons:
              </span>
              <div className="space-y-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={cn(
                      'w-full text-left text-xs p-2 rounded-lg border transition-all cursor-pointer block',
                      rejectionReason === preset
                        ? 'bg-rose-50 text-rose-900 border-rose-300 font-medium'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/80'
                    )}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Detailed Feedback / Notes:</label>
              <textarea
                rows={3}
                placeholder="Enter specific audit findings or state medical board reference..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectionModalDoctor(null)
                  setRevokingDoctor(null)
                }}
                disabled={actionLoadingId !== null}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={actionLoadingId !== null}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 font-bold font-serif text-base flex items-center justify-center border border-teal-200">
                  {getDoctorInitials(dossierDoctor.name)}
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif text-slate-900">Dr. {dossierDoctor.name}</h2>
                  <p className="text-xs text-slate-500">Care Code: {dossierDoctor.careCode} • {dossierDoctor.clinic}</p>
                </div>
              </div>
              <button
                onClick={() => setDossierDoctor(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold capitalize',
                    dossierDoctor.verificationStatus === 'verified' && 'bg-emerald-100 text-emerald-800',
                    dossierDoctor.verificationStatus === 'pending' && 'bg-amber-100 text-amber-800',
                    dossierDoctor.verificationStatus === 'rejected' && 'bg-rose-100 text-rose-800'
                  )}
                >
                  {dossierDoctor.verificationStatus}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Registered: {new Date(dossierDoctor.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Dossier sections */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Contact & Clinic Details</h4>
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Full Legal Name</span>
                  <span className="font-semibold text-slate-800">{dossierDoctor.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Primary Email</span>
                  <span className="font-semibold text-slate-800">{dossierDoctor.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Specialty Practice</span>
                  <span className="font-semibold text-slate-800">{dossierDoctor.specialty}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Affiliated Health Clinic</span>
                  <span className="font-semibold text-slate-800">{dossierDoctor.clinic}</span>
                </div>
              </div>

              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Licensure Credentials</h4>
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">License / NPI Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{dossierDoctor.license}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Issuing Board Authority</span>
                  <span className="font-semibold text-slate-800">{dossierDoctor.issuingAuthority || 'State Board'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Official Registry Lookup</span>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `medical board license verification "${dossierDoctor.license}" "${dossierDoctor.name}"`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Check State Registry</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Certificate Document</span>
                  {dossierDoctor.licenseDocumentUrl ? (
                    <a
                      href={dossierDoctor.licenseDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Download Credential File</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No document uploaded</span>
                  )}
                </div>
              </div>

              {/* Audit history */}
              {dossierDoctor.verifiedAt && (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-900">
                  <span className="font-bold block">Verified Record:</span>
                  <span>
                    Certified on {new Date(dossierDoctor.verifiedAt).toLocaleString()} by {dossierDoctor.verifiedBy || 'Administrator'}.
                  </span>
                </div>
              )}

              {dossierDoctor.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-900">
                  <span className="font-bold block">Rejection / Revocation Record:</span>
                  <span className="mt-1 block leading-relaxed">{dossierDoctor.rejectionReason}</span>
                </div>
              )}
            </div>

            {/* Actions in dossier */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDossierDoctor(null)}>
                Close Dossier
              </Button>

              <div className="flex gap-2">
                {dossierDoctor.verificationStatus !== 'verified' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovingDoctor(dossierDoctor)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
                    className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-semibold gap-1.5"
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
    </div>
  )
}
