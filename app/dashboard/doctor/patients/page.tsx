'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Search,
  UserPlus,
  Users,
  Copy,
  Check,
  Share2,
  X,
  Loader2,
  Mail,
  User,
  Phone,
  Clock,
  CheckCircle2,
} from 'lucide-react'

import { useDoctorStore } from '@/lib/stores/doctor.store'
import type { Patient } from '@/lib/db'

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Invite modal form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const doctorId = useDoctorStore(state => state.doctorId)
  const doctor = useDoctorStore(state => state.doctor)
  const patients = useDoctorStore(state => state.patients)
  const isLoading = useDoctorStore(state => state.isLoading)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

  useEffect(() => {
    if (doctorId && patients.length === 0 && !isLoading) {
      void loadDashboard(doctorId)
    }
  }, [doctorId, patients.length, isLoading, loadDashboard])

  const careCode = doctor?.careCode || (doctorId ? `NOA-${doctorId.replace('doctor-', '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}` : 'NOA-DOC')

  const copyCareCode = () => {
    if (typeof navigator !== 'undefined') {
      void navigator.clipboard.writeText(careCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const copyIntakeLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/intake?doctorCode=${encodeURIComponent(careCode)}`
      void navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsSubmittingInvite(true)
    setInviteMessage(null)

    try {
      const res = await fetch('/api/patients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          firstName: inviteFirstName.trim(),
          lastName: inviteLastName.trim(),
          phone: invitePhone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add patient')
      }

      setInviteMessage({ type: 'success', text: data.message || 'Patient successfully registered!' })
      setInviteEmail('')
      setInviteFirstName('')
      setInviteLastName('')
      setInvitePhone('')
      if (doctorId) {
        await loadDashboard(doctorId)
      }
      setTimeout(() => {
        setIsModalOpen(false)
        setInviteMessage(null)
      }, 2000)
    } catch (err: any) {
      setInviteMessage({ type: 'error', text: err.message || 'Failed to add patient' })
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  const allPatients: Patient[] = patients

  const filteredPatients = allPatients.filter(
    patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const withConditionsCount = allPatients.filter(
    (patient: Patient) => (patient.conditions?.length || 0) > 0
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-1 text-deep-ink">Patients</h1>
          <p className="text-slate text-xs sm:text-sm">Manage and review your patient registry</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-2 font-medium text-xs sm:text-sm cursor-pointer shadow-2xs"
          >
            <UserPlus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Doctor Care Code & Share Card */}
      <Card className="p-4 sm:p-5 border border-deep-ink/10 bg-canvas/40 backdrop-blur-sm rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">Your Doctor Care Code:</span>
            <span className="text-sm font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-deep-ink/10 text-deep-ink tracking-widest shadow-2xs">
              {careCode}
            </span>
          </div>
          <p className="text-xs text-slate">
            Patients can enter this code in their portal or start an intake directly with your pre-configured link.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={copyCareCode}
            className="rounded-full text-xs gap-1.5 border-deep-ink/15 hover:border-deep-ink/30 cursor-pointer flex-1 md:flex-initial"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyIntakeLink}
            className="rounded-full text-xs gap-1.5 border-deep-ink/15 hover:border-deep-ink/30 cursor-pointer flex-1 md:flex-initial"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Intake Link'}</span>
          </Button>
        </div>
      </Card>

      {/* Search Bar */}
      <Card className="p-2 px-4 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate shrink-0" />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full py-2 text-deep-ink placeholder-slate focus:outline-none bg-transparent text-base sm:text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate hover:text-deep-ink font-medium px-2 py-1 cursor-pointer"
          >
            Clear
          </button>
        )}
      </Card>

      {/* Patient Stats Badges */}
      <div className="flex gap-2.5 sm:gap-3 flex-wrap">
        <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 text-xs font-medium">
          Total Patients: {allPatients.length}
        </Badge>
        <Badge variant="success" className="px-3 sm:px-4 py-1.5 text-xs font-medium">
          With Conditions: {withConditionsCount}
        </Badge>
      </div>

      {/* Patients Table & Mobile Card List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate text-sm">Loading patient records...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="h-8 w-8 text-slate/50" />}
              title="No patients found"
              description={searchTerm ? `No patient records matching "${searchTerm}".` : 'No patient records available yet.'}
            />
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="divide-y divide-deep-ink/10 md:hidden">
              {filteredPatients.map(patient => (
                <div key={patient.id} className="p-4 space-y-3 hover:bg-soft-meadow/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-deep-ink text-base">
                          {patient.firstName} {patient.lastName}
                        </h4>
                        {patient.linkStatus === 'pending_patient_approval' && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                            Pending Invite
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate truncate mt-0.5">{patient.email}</p>
                    </div>
                    <Link
                      href={`/dashboard/doctor/patients/${patient.id}`}
                      className="shrink-0 inline-flex items-center text-xs font-semibold text-deep-ink hover:text-deep-ink/70 px-3 py-1.5 rounded-full border border-deep-ink/15 hover:border-deep-ink/30 bg-white shadow-2xs"
                    >
                      View Record
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate pt-1 border-t border-deep-ink/5">
                    <div>
                      <span className="text-slate/70">Phone: </span>
                      <span className="text-deep-ink">{patient.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate/70">DOB: </span>
                      <span className="text-deep-ink">{patient.dateOfBirth || '—'}</span>
                    </div>
                  </div>

                  {patient.conditions && patient.conditions.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {patient.conditions.map((condition, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-deep-ink/10 bg-soft-meadow/60">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate">Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate">DOB</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate">Conditions</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deep-ink/5">
                  {filteredPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-soft-meadow/40 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-deep-ink whitespace-nowrap">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate whitespace-nowrap">{patient.email}</td>
                      <td className="px-6 py-4 text-sm text-slate whitespace-nowrap">{patient.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate whitespace-nowrap">{patient.dateOfBirth || '—'}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {patient.linkStatus === 'pending_patient_approval' ? (
                          <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            Pending Invite
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate">
                        <div className="flex gap-1.5 flex-wrap max-w-xs">
                          {patient.conditions && patient.conditions.length > 0 ? (
                            patient.conditions.slice(0, 2).map((condition, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[11px] px-2 py-0.5">
                                {condition}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate/60 text-xs">—</span>
                          )}
                          {(patient.conditions?.length || 0) > 2 && (
                            <span className="text-xs text-slate font-medium">
                              +{patient.conditions!.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/doctor/patients/${patient.id}`}
                          className="inline-flex items-center text-xs font-semibold text-deep-ink hover:text-deep-ink/70 px-3 py-1.5 rounded-full border border-deep-ink/15 hover:border-deep-ink/30 transition-colors"
                        >
                          View Record
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-deep-ink/10 relative">
            <div className="flex items-center justify-between pb-2 border-b border-deep-ink/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-soft-meadow flex items-center justify-center text-deep-ink">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold font-serif text-lg text-deep-ink">Add Patient Record</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setInviteMessage(null)
                }}
                className="text-slate hover:text-deep-ink p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  inviteMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                <span>{inviteMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-deep-ink flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-deep-ink/15 text-deep-ink placeholder-slate/60 text-xs focus:outline-none focus:border-deep-ink bg-canvas/30"
                />
                <p className="text-[10px] text-slate">
                  If the patient already has a Noa account, an invitation request will appear on their portal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-deep-ink flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate" />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={e => setInviteFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-3.5 py-2 rounded-xl border border-deep-ink/15 text-deep-ink placeholder-slate/60 text-xs focus:outline-none focus:border-deep-ink bg-canvas/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-deep-ink flex items-center gap-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={inviteLastName}
                    onChange={e => setInviteLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3.5 py-2 rounded-xl border border-deep-ink/15 text-deep-ink placeholder-slate/60 text-xs focus:outline-none focus:border-deep-ink bg-canvas/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-deep-ink flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={e => setInvitePhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 rounded-xl border border-deep-ink/15 text-deep-ink placeholder-slate/60 text-xs focus:outline-none focus:border-deep-ink bg-canvas/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    setInviteMessage(null)
                  }}
                  className="rounded-full text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingInvite || !inviteEmail.trim()}
                  className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs px-5 font-medium cursor-pointer shadow-2xs"
                >
                  {isSubmittingInvite ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Add / Send Invite'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
