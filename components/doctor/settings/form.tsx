'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { SettingsFormState } from './types';

interface DoctorSettingsFormProps {
  formState: SettingsFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
  isSaving: boolean;
  isLoading: boolean;
}

export function DoctorSettingsForm({
  formState,
  onChange,
  onSubmit,
  onReload,
  isSaving,
  isLoading,
}: DoctorSettingsFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="border-deep-ink/10 space-y-5 rounded-3xl border bg-white p-4 sm:p-6"
    >
      <div>
        <h2 className="mb-1 font-serif text-lg font-semibold sm:text-xl">Edit profile</h2>
        <p className="text-slate text-xs sm:text-sm">Change how you appear across the dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-deep-ink mb-1 block text-sm font-medium">Name</label>
          <input
            name="name"
            value={formState.name}
            onChange={onChange}
            className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
            placeholder="Dr. Alex Rivera"
            required
          />
        </div>

        <div>
          <label className="text-deep-ink mb-1 block text-sm font-medium">Specialty</label>
          <select
            name="specialty"
            value={formState.specialty}
            onChange={onChange}
            className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
          >
            <option value="">Select specialty</option>
            <option value="General Practice">General Practice</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Psychiatry">Psychiatry</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-deep-ink mb-1 block text-sm font-medium">Clinic</label>
          <input
            name="clinic"
            value={formState.clinic}
            onChange={onChange}
            className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
            placeholder="North Star Health"
          />
        </div>

        <div>
          <label className="text-deep-ink mb-1 block text-sm font-medium">Phone</label>
          <input
            name="phone"
            value={formState.phone}
            onChange={onChange}
            className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-deep-ink mb-1 block text-sm font-medium">Avatar URL</label>
          <input
            name="avatar"
            value={formState.avatar}
            onChange={onChange}
            className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={isSaving || isLoading}
          className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full rounded-full sm:w-auto"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReload}
          className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full rounded-full sm:w-auto"
        >
          Reload
        </Button>
      </div>
    </form>
  );
}
