'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  lastVisit: string
  status: 'active' | 'inactive'
  conditions: string[]
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1965-03-15',
    lastVisit: '2 days ago',
    status: 'active',
    conditions: ['Hypertension', 'Type 2 Diabetes'],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(555) 234-5678',
    dateOfBirth: '1978-07-22',
    lastVisit: '1 week ago',
    status: 'active',
    conditions: ['Migraine'],
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    phone: '(555) 345-6789',
    dateOfBirth: '1955-11-08',
    lastVisit: '3 weeks ago',
    status: 'inactive',
    conditions: ['Arthritis', 'High Cholesterol'],
  },
]

export default function PatientsPage() {
  const [patients, setPatients] = useState(mockPatients)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPatients = patients.filter(
    patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-deep-ink/10 bg-soft-meadow/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Last Visit</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Conditions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-deep-ink">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-deep-ink">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-deep-ink/10 hover:bg-soft-meadow/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-deep-ink">{patient.name}</td>
                  <td className="px-6 py-4 text-sm text-slate">{patient.email}</td>
                  <td className="px-6 py-4 text-sm text-slate">{patient.phone}</td>
                  <td className="px-6 py-4 text-sm text-slate">{patient.lastVisit}</td>
                  <td className="px-6 py-4 text-sm text-slate">
                    <div className="flex gap-1 flex-wrap">
                      {patient.conditions.map((condition, idx) => (
                        <span key={idx} className="bg-slate/10 text-slate text-xs px-2 py-1 rounded-full">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        patient.status === 'active' ? 'bg-moss-green/20 text-deep-ink' : 'bg-slate/10 text-slate'
                      }`}
                    >
                      {patient.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/patients/${patient.id}`}>
                      <button className="text-hi-yellow hover:underline text-sm font-medium">View</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
