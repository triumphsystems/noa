'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, UserPlus, Users } from 'lucide-react'

import { useDoctorStore } from '@/lib/stores/doctor.store'

interface PatientData {
  id: string
  doctorId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  allergies?: string[]
  conditions?: string[]
  createdAt: number
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const doctorId = useDoctorStore(state => state.doctorId)
  const patients = useDoctorStore(state => state.patients)
  const isLoading = useDoctorStore(state => state.isLoading)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

  useEffect(() => {
    if (doctorId && patients.length === 0 && !isLoading) {
      void loadDashboard(doctorId)
    }
  }, [doctorId, patients.length, isLoading, loadDashboard])

  const allPatients: PatientData[] = patients

  const filteredPatients = allPatients.filter(
    patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const withConditionsCount = allPatients.filter(
    (patient: PatientData) => (patient.conditions?.length || 0) > 0
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-1 text-deep-ink">Patients</h1>
          <p className="text-slate text-xs sm:text-sm">Manage and review your patient registry</p>
        </div>
        <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-2 font-medium text-xs sm:text-sm">
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

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
            className="text-xs text-slate hover:text-deep-ink font-medium px-2 py-1"
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
                      <h4 className="font-semibold text-deep-ink text-base">
                        {patient.firstName} {patient.lastName}
                      </h4>
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
    </div>
  )
}
