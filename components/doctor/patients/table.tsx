'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { Patient } from '@/lib/db';

interface PatientsTableProps {
  isLoading: boolean;
  patients: Patient[];
  searchTerm: string;
  linkActionLoadingId: string | null;
  onRespondLink: (patientId: string, action: 'accept' | 'decline') => void;
}

export function PatientsTable({
  isLoading,
  patients,
  searchTerm,
  linkActionLoadingId,
  onRespondLink,
}: PatientsTableProps) {
  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <div className="text-slate p-12 text-center text-sm">
          Loading patient records...
        </div>
      ) : patients.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<Users className="text-slate/50 h-8 w-8" />}
            title="No patients found"
            description={
              searchTerm
                ? `No patient records matching "${searchTerm}".`
                : 'No patient records available yet.'
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="divide-deep-ink/10 divide-y md:hidden">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="hover:bg-soft-meadow/30 space-y-3 p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-deep-ink text-base font-semibold">
                        {[patient.firstName, patient.lastName]
                          .filter(Boolean)
                          .join(' ')
                          .trim() ||
                          patient.email ||
                          'Patient'}
                      </h4>
                      {patient.linkStatus === 'pending_patient_approval' && (
                        <Badge
                          variant="secondary"
                          className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                        >
                          Pending Invite
                        </Badge>
                      )}
                      {patient.linkStatus === 'pending_doctor_approval' && (
                        <Badge
                          variant="secondary"
                          className="border-blue-200 bg-blue-50 text-[10px] text-blue-800"
                        >
                          Connection Request
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate mt-0.5 truncate text-xs">
                      {patient.email}
                    </p>
                  </div>
                  {patient.linkStatus === 'pending_doctor_approval' ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => onRespondLink(patient.id, 'accept')}
                        disabled={linkActionLoadingId === patient.id}
                        className="h-7 rounded-full bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRespondLink(patient.id, 'decline')}
                        disabled={linkActionLoadingId === patient.id}
                        className="h-7 rounded-full border-rose-200 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Decline
                      </Button>
                    </div>
                  ) : patient.linkStatus === 'pending_patient_approval' ? (
                    <span className="shrink-0 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                      Pending Acceptance
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/doctor/patients/${patient.id}`}
                      className="text-deep-ink hover:text-deep-ink/70 border-deep-ink/15 hover:border-deep-ink/30 inline-flex shrink-0 items-center rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-2xs"
                    >
                      View Record
                    </Link>
                  )}
                </div>

                <div className="text-slate border-deep-ink/5 grid grid-cols-2 gap-2 border-t pt-1 text-xs">
                  <div>
                    <span className="text-slate/70">Phone: </span>
                    <span className="text-deep-ink">
                      {patient.phone ||
                        (patient.linkStatus === 'pending_patient_approval'
                          ? 'Hidden (pending)'
                          : '—')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate/70">DOB: </span>
                    <span className="text-deep-ink">
                      {patient.dateOfBirth ||
                        (patient.linkStatus === 'pending_patient_approval'
                          ? 'Hidden (pending)'
                          : '—')}
                    </span>
                  </div>
                </div>

                {patient.conditions && patient.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {patient.conditions.map((condition, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px]"
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-deep-ink/10 bg-soft-meadow/60 border-b">
                  <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                    Name
                  </th>
                  <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                    Email
                  </th>
                  <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                    Phone
                  </th>
                  <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                    DOB
                  </th>
                  <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-slate px-6 py-4 text-xs font-semibold tracking-wider uppercase">
                    Conditions
                  </th>
                  <th className="text-slate px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-deep-ink/5 divide-y">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-soft-meadow/40 transition-colors"
                  >
                    <td className="text-deep-ink px-6 py-4 text-sm font-medium whitespace-nowrap">
                      {[patient.firstName, patient.lastName]
                        .filter(Boolean)
                        .join(' ')
                        .trim() ||
                        patient.email ||
                        'Patient'}
                    </td>
                    <td className="text-slate px-6 py-4 text-sm whitespace-nowrap">
                      {patient.email || '—'}
                    </td>
                    <td className="text-slate px-6 py-4 text-sm whitespace-nowrap">
                      {patient.linkStatus === 'pending_patient_approval' ? (
                        <span className="text-slate/60 text-xs italic">
                          Hidden
                        </span>
                      ) : (
                        patient.phone || '—'
                      )}
                    </td>
                    <td className="text-slate px-6 py-4 text-sm whitespace-nowrap">
                      {patient.linkStatus === 'pending_patient_approval' ? (
                        <span className="text-slate/60 text-xs italic">
                          Hidden
                        </span>
                      ) : (
                        patient.dateOfBirth || '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {patient.linkStatus === 'pending_patient_approval' && (
                        <Badge
                          variant="secondary"
                          className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                        >
                          <Clock className="mr-1 inline h-3 w-3" />
                          Pending Invite
                        </Badge>
                      )}
                      {patient.linkStatus === 'pending_doctor_approval' && (
                        <Badge
                          variant="secondary"
                          className="border-blue-200 bg-blue-50 text-[10px] text-blue-800"
                        >
                          <Clock className="mr-1 inline h-3 w-3" />
                          Connection Request
                        </Badge>
                      )}
                      {patient.linkStatus !== 'pending_patient_approval' &&
                        patient.linkStatus !== 'pending_doctor_approval' && (
                          <Badge
                            variant="secondary"
                            className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                          >
                            <CheckCircle2 className="mr-1 inline h-3 w-3" />
                            Active
                          </Badge>
                        )}
                    </td>
                    <td className="text-slate px-6 py-4 text-sm">
                      {patient.linkStatus === 'pending_patient_approval' ? (
                        <span className="text-slate/50 text-xs italic">
                          Locked
                        </span>
                      ) : (
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {patient.conditions &&
                          patient.conditions.length > 0 ? (
                            patient.conditions
                              .slice(0, 2)
                              .map((condition, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="px-2 py-0.5 text-[11px]"
                                >
                                  {condition}
                                </Badge>
                              ))
                          ) : (
                            <span className="text-slate/60 text-xs">—</span>
                          )}
                          {(patient.conditions?.length || 0) > 2 && (
                            <span className="text-slate text-xs font-medium">
                              +{patient.conditions!.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {patient.linkStatus === 'pending_doctor_approval' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => onRespondLink(patient.id, 'accept')}
                            disabled={linkActionLoadingId === patient.id}
                            className="h-8 cursor-pointer rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRespondLink(patient.id, 'decline')}
                            disabled={linkActionLoadingId === patient.id}
                            className="h-8 cursor-pointer rounded-full border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Decline
                          </Button>
                        </div>
                      ) : patient.linkStatus === 'pending_patient_approval' ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                          Pending Acceptance
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/doctor/patients/${patient.id}`}
                          className="text-deep-ink hover:text-deep-ink/70 border-deep-ink/15 hover:border-deep-ink/30 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          View Record
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
