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
  Filter,
  RefreshCw,
  LogOut,
  Building,
  Award,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
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
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<DoctorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [rejectionModalDoctor, setRejectionModalDoctor] = useState<DoctorItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchDoctors = async (statusFilter?: string) => {
    try {
      setRefreshing(true)
      const query = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/admin/doctors${query}`)

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?from=/dashboard/admin')
        return
      }

      const data = await res.json()
      if (data.success && Array.isArray(data.doctors)) {
        setDoctors(data.doctors)
      }
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err)
      setNotification({ type: 'error', message: 'Failed to load doctors list.' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDoctors(activeTab)
  }, [activeTab])

  const handleApprove = async (doctor: DoctorItem) => {
    if (actionLoadingId) return
    setActionLoadingId(doctor.id)
    setNotification(null)

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to approve doctor')

      setNotification({
        type: 'success',
        message: `Dr. ${doctor.name} was successfully verified and granted clinical privileges.`,
      })
      await fetchDoctors(activeTab)
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Approval failed' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionModalDoctor || actionLoadingId) return
    setActionLoadingId(rejectionModalDoctor.id)
    setNotification(null)

    try {
      const res = await fetch(`/api/admin/doctors/${rejectionModalDoctor.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to reject doctor')

      setNotification({
        type: 'success',
        message: `Application for Dr. ${rejectionModalDoctor.name} was marked as rejected.`,
      })
      setRejectionModalDoctor(null)
      setRejectionReason('')
      await fetchDoctors(activeTab)
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Rejection failed' })
    } finally {
      setActionLoadingId(null)
    }
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

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.license.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())

      if (activeTab === 'all') return matchesSearch
      return matchesSearch && doc.verificationStatus === activeTab
    })
  }, [doctors, searchQuery, activeTab])

  const counts = useMemo(() => {
    return {
      pending: doctors.filter(d => d.verificationStatus === 'pending').length,
      verified: doctors.filter(d => d.verificationStatus === 'verified').length,
      rejected: doctors.filter(d => d.verificationStatus === 'rejected').length,
      total: doctors.length,
    }
  }, [doctors])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Admin Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">Noa</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                  Superadmin Console
                </span>
              </div>
              <p className="text-xs text-slate-500">Clinician Verification & Practice Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDoctors(activeTab)}
              disabled={refreshing}
              className="gap-2 text-slate-600"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              <span>Refresh</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Notification Banner */}
        {notification && (
          <div
            className={cn(
              'p-4 rounded-xl text-sm flex items-center justify-between transition-all',
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            )}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="font-bold ml-4 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('pending')}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-xs',
              activeTab === 'pending' ? 'ring-2 ring-amber-500 border-amber-500' : 'border-slate-200'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{counts.pending}</div>
            <p className="mt-1 text-xs text-slate-500">Awaiting medical credential check</p>
          </div>

          <div
            onClick={() => setActiveTab('verified')}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-xs',
              activeTab === 'verified' ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Verified Clinicians</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{counts.verified}</div>
            <p className="mt-1 text-xs text-slate-500">Active licensed providers</p>
          </div>

          <div
            onClick={() => setActiveTab('rejected')}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-xs',
              activeTab === 'rejected' ? 'ring-2 ring-rose-500 border-rose-500' : 'border-slate-200'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Rejected / Suspended</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{counts.rejected}</div>
            <p className="mt-1 text-xs text-slate-500">Revoked clinical privileges</p>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={cn(
              'p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-xs',
              activeTab === 'all' ? 'ring-2 ring-teal-500 border-teal-500' : 'border-slate-200'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Practitioners</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{counts.total}</div>
            <p className="mt-1 text-xs text-slate-500">Registered across all clinics</p>
          </div>
        </div>

        {/* Action Controls & Filtering */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, clinic, or license..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            {(['pending', 'verified', 'rejected', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer',
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Clinicians Table / Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
              <span>Loading registered clinicians...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-2">
              <Stethoscope className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No clinicians found</p>
              <p className="text-xs text-slate-400">
                {activeTab === 'pending'
                  ? 'All doctor registrations have been reviewed.'
                  : 'No doctor records match the current filter or search query.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDoctors.map(doctor => (
                <div
                  key={doctor.id}
                  className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Doctor Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">Dr. {doctor.name}</h3>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border',
                          doctor.verificationStatus === 'verified' &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200',
                          doctor.verificationStatus === 'pending' &&
                            'bg-amber-50 text-amber-700 border-amber-200',
                          doctor.verificationStatus === 'rejected' &&
                            'bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        {doctor.verificationStatus === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {doctor.verificationStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {doctor.verificationStatus === 'rejected' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{doctor.verificationStatus}</span>
                      </span>

                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                        Care Code: {doctor.careCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-6 text-xs text-slate-600">
                      <div>
                        <span className="font-medium text-slate-400">Email: </span>
                        <span className="text-slate-700">{doctor.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400">Specialty: </span>
                        <span className="text-slate-700">{doctor.specialty}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400">Clinic: </span>
                        <span className="text-slate-700">{doctor.clinic}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400">Medical License: </span>
                        <span className="font-mono font-semibold text-slate-800">{doctor.license}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400">Authority: </span>
                        <span className="text-slate-700">{doctor.issuingAuthority || 'Unspecified'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400">Registered: </span>
                        <span className="text-slate-700">
                          {new Date(doctor.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {doctor.licenseDocumentUrl && (
                        <div>
                          <span className="font-medium text-slate-400">License Document: </span>
                          <a
                            href={doctor.licenseDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-deep-ink font-semibold underline underline-offset-2 hover:text-slate-800 inline-flex items-center gap-1"
                          >
                            <span>View Certificate</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {doctor.rejectionReason && (
                      <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100 mt-2">
                        <span className="font-semibold">Rejection Reason:</span> {doctor.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                    {doctor.verificationStatus === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(doctor)}
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
                          className="border-rose-200 text-rose-700 hover:bg-rose-50 gap-1.5 text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}

                    {doctor.verificationStatus === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(doctor)}
                        disabled={actionLoadingId === doctor.id}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Re-Verify</span>
                      </Button>
                    )}

                    {doctor.verificationStatus === 'verified' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRejectionModalDoctor(doctor)
                          setRejectionReason('')
                        }}
                        disabled={actionLoadingId === doctor.id}
                        className="text-slate-400 hover:text-rose-600 text-xs"
                      >
                        <span>Revoke Access</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rejection Modal */}
      {rejectionModalDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Doctor Application</h3>
                <p className="text-xs text-slate-500">Dr. {rejectionModalDoctor.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please specify why this applicant cannot be verified. This feedback will be recorded in the clinical audit
              log and accessible to the provider.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. License number not found on state medical board registry."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectionModalDoctor(null)}
                disabled={actionLoadingId !== null}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={actionLoadingId !== null}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
