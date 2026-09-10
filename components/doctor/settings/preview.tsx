'use client';

import React from 'react';
import type { SettingsFormState } from './types';

interface DoctorSettingsPreviewProps {
  formState: SettingsFormState;
  doctorAvatar?: string | null;
  doctorName?: string | null;
  doctorSpecialty?: string | null;
  doctorClinic?: string | null;
  doctorPhone?: string | null;
}

export function DoctorSettingsPreview({
  formState,
  doctorAvatar,
  doctorName,
  doctorSpecialty,
  doctorClinic,
  doctorPhone,
}: DoctorSettingsPreviewProps) {
  const avatarUrl = formState.avatar || doctorAvatar;
  const displayName = formState.name || doctorName || 'Doctor Name';
  const displaySpecialty =
    formState.specialty || doctorSpecialty || 'Specialty not selected';
  const displayClinic = formState.clinic || doctorClinic || 'Not set';
  const displayPhone = formState.phone || doctorPhone || 'Not set';

  return (
    <div className="space-y-6">
      <div className="border-deep-ink/10 bg-soft-meadow rounded-3xl border p-6">
        <h2 className="mb-4 font-serif text-lg font-semibold">
          Profile preview
        </h2>
        <div className="mb-4 flex items-center gap-4">
          <div className="bg-hi-yellow text-deep-ink border-deep-ink/10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border font-serif text-lg font-bold">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-deep-ink truncate font-semibold">
              {displayName}
            </p>
            <p className="text-slate truncate text-xs">{displaySpecialty}</p>
          </div>
        </div>
        <div className="text-deep-ink border-deep-ink/10 space-y-2 border-t pt-3 text-sm">
          <p>
            <span className="text-slate">Clinic:</span> {displayClinic}
          </p>
          <p>
            <span className="text-slate">Phone:</span> {displayPhone}
          </p>
        </div>
      </div>

      <div className="border-deep-ink/10 space-y-4 rounded-3xl border bg-white p-6">
        <h2 className="font-serif text-lg font-semibold">
          Preferences & Governance
        </h2>
        <div className="text-slate space-y-3 text-sm">
          <div className="bg-soft-meadow/40 rounded-2xl p-4">
            Notification preferences, security settings, and export controls are
            securely managed under HIPAA guidelines.
          </div>
          <div className="bg-soft-meadow/40 rounded-2xl p-4">
            Session defaults and clinical documentation rules automatically
            inherit from your primary specialty profile.
          </div>
        </div>
      </div>
    </div>
  );
}
