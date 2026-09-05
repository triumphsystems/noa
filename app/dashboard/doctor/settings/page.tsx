'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useDoctorStore } from '@/lib/stores/doctor.store';

type SettingsFormState = {
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  avatar: string;
};

const defaultFormState: SettingsFormState = {
  name: '',
  specialty: '',
  clinic: '',
  phone: '',
  avatar: '',
};

export default function DoctorSettingsPage() {
  const doctor = useDoctorStore((state) => state.doctor);
  const doctorId = useDoctorStore((state) => state.doctorId);
  const isSaving = useDoctorStore((state) => state.isSaving);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const error = useDoctorStore((state) => state.error);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);
  const updateDoctorProfile = useDoctorStore(
    (state) => state.updateDoctorProfile
  );

  const [formState, setFormState] =
    useState<SettingsFormState>(defaultFormState);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (doctor) {
      setFormState({
        name: doctor.name || '',
        specialty: doctor.specialty || '',
        clinic: doctor.clinic || '',
        phone: doctor.phone || '',
        avatar: doctor.avatar || '',
      });
    }
  }, [doctor]);

  useEffect(() => {
    if (!doctor && doctorId) {
      void loadDashboard(doctorId);
    }
  }, [doctor, doctorId, loadDashboard]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setSuccess('');
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess('');

    const updatedDoctor = await updateDoctorProfile({
      name: formState.name,
      specialty: formState.specialty,
      clinic: formState.clinic,
      phone: formState.phone || undefined,
      avatar: formState.avatar || undefined,
    });

    if (updatedDoctor) {
      setSuccess('Profile saved to DynamoDB.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      <div>
        <h1 className="mb-2 font-serif text-2xl font-bold sm:text-3xl">
          Profile and preferences
        </h1>
      </div>

      {error && <ErrorAlert message={error} />}

      {success && (
        <div className="border-moss-green/30 bg-moss-green/10 text-deep-ink rounded-3xl border p-4 text-sm">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="border-deep-ink/10 space-y-5 rounded-3xl border bg-white p-4 sm:p-6"
        >
          <div>
            <h2 className="mb-1 font-serif text-lg font-semibold sm:text-xl">
              Edit profile
            </h2>
            <p className="text-slate text-xs sm:text-sm">
              Change how you appear across the dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-deep-ink mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                name="name"
                value={formState.name}
                onChange={handleChange}
                className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
                placeholder="Dr. Alex Rivera"
                required
              />
            </div>

            <div>
              <label className="text-deep-ink mb-1 block text-sm font-medium">
                Specialty
              </label>
              <select
                name="specialty"
                value={formState.specialty}
                onChange={handleChange}
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
              <label className="text-deep-ink mb-1 block text-sm font-medium">
                Clinic
              </label>
              <input
                name="clinic"
                value={formState.clinic}
                onChange={handleChange}
                className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
                placeholder="North Star Health"
              />
            </div>

            <div>
              <label className="text-deep-ink mb-1 block text-sm font-medium">
                Phone
              </label>
              <input
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-full border px-4 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-deep-ink mb-1 block text-sm font-medium">
                Avatar URL
              </label>
              <input
                name="avatar"
                value={formState.avatar}
                onChange={handleChange}
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
              onClick={() => doctorId && void loadDashboard(doctorId)}
              className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full rounded-full sm:w-auto"
            >
              Reload
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="border-deep-ink/10 bg-soft-meadow rounded-3xl border p-6">
            <h2 className="mb-4 font-serif text-lg font-semibold">
              Profile preview
            </h2>
            <div className="mb-4 flex items-center gap-4">
              <div className="bg-hi-yellow text-deep-ink border-deep-ink/10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border font-serif text-lg font-bold">
                {formState.avatar || doctor?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formState.avatar || doctor?.avatar}
                    alt={formState.name || doctor?.name || 'Doctor'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (formState.name || doctor?.name || 'D')
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-deep-ink truncate font-semibold">
                  {formState.name || doctor?.name || 'Doctor Name'}
                </p>
                <p className="text-slate truncate text-xs">
                  {formState.specialty ||
                    doctor?.specialty ||
                    'Specialty not selected'}
                </p>
              </div>
            </div>
            <div className="text-deep-ink border-deep-ink/10 space-y-2 border-t pt-3 text-sm">
              <p>
                <span className="text-slate">Clinic:</span>{' '}
                {formState.clinic || doctor?.clinic || 'Not set'}
              </p>
              <p>
                <span className="text-slate">Phone:</span>{' '}
                {formState.phone || doctor?.phone || 'Not set'}
              </p>
            </div>
          </div>

          <div className="border-deep-ink/10 space-y-4 rounded-3xl border bg-white p-6">
            <h2 className="font-serif text-lg font-semibold">Other things</h2>
            <div className="text-slate space-y-3 text-sm">
              <div className="bg-soft-meadow/40 rounded-2xl p-4">
                Notification preferences, security settings, and export controls
                can live here.
              </div>
              <div className="bg-soft-meadow/40 rounded-2xl p-4">
                Session defaults and automation rules should use the same
                contract pattern as the profile fields.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
