'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

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

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function PatientsPage() {
  const [doctorId, setDoctorId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch doctor ID from localStorage (would come from auth context)
  useEffect(() => {
    const storedDoctorId = localStorage.getItem('doctorId') || 'doctor-demo'
    setDoctorId(storedDoctorId)
  }, [])

  // Fetch patients from DynamoDB
  const { data: patientsData, isLoading: patientsLoading } = useSWR(
    doctorId ? `/api/patients?doctorId=${doctorId}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  )

  const allPatients: PatientData[] = patientsData?.patients || []

  const filteredPatients = allPatients.filter(
    patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Patients</h1>
          <p className="text-slate">Manage your patient list</p>
        </div>
        <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
          Add Patient
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-deep-ink/10">
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 text-deep-ink placeholder-slate focus:outline-none"
        />
      </div>

      {/* Patient Count */}
      <div className="flex gap-4">
        <div className="bg-soft-meadow rounded-3xl px-6 py-3 text-sm font-medium text-deep-ink">
          Total: {patients.length}
        </div>
        <div className="bg-moss-green/20 rounded-3xl px-6 py-3 text-sm font-medium text-deep-ink">
          Active: {patients.filter(p => p.status === 'active').length}
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-3xl border border-deep-ink/10 overflow-hidden">
        {patientsLoading ? (
          <div className="p-8 text-center text-slate">Loading patients...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-deep-ink/10 bg-soft-meadow/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">DOB</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Conditions</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-deep-ink">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-slate">
                      No patients found
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-deep-ink/10 hover:bg-soft-meadow/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-deep-ink">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate">{patient.email}</td>
                      <td className="px-6 py-4 text-sm text-slate">{patient.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate">{patient.dateOfBirth || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate">
                        <div className="flex gap-1 flex-wrap">
                          {patient.conditions && patient.conditions.length > 0
                            ? patient.conditions.slice(0, 2).map((condition, idx) => (
                                <span key={idx} className="bg-slate/10 text-slate text-xs px-2 py-1 rounded-full">
                                  {condition}
                                </span>
                              ))
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          <button className="text-hi-yellow hover:underline text-sm font-medium">View</button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="bg-soft-meadow/50 rounded-3xl p-12 text-center">
          <p className="text-slate mb-4">No patients found matching your search.</p>
        </div>
      )}
    </div>
  )
}
