'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  DoctorSettingsForm,
  DoctorSettingsPreview,
  type SettingsFormState,
} from '@/components/doctor/settings';
import { updateDoctorProfile } from '@/app/dashboard/doctor/actions';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import type { Doctor } from '@/lib/db';

interface DoctorSettingsViewProps {
  initialDoctor: Doctor;
}

export function DoctorSettingsView({ initialDoctor }: DoctorSettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const setDoctor = useDoctorStore((state) => state.setDoctor);

  const [formState, setFormState] = React.useState<SettingsFormState>({
    name: initialDoctor.name || '',
    specialty: initialDoctor.specialty || '',
    clinic: initialDoctor.clinic || '',
    phone: initialDoctor.phone || '',
    avatar: initialDoctor.avatar || '',
  });

  const [currentDoctor, setCurrentDoctor] =
    React.useState<Doctor>(initialDoctor);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string>('');

  // Synchronize store with server initial doctor if needed
  React.useEffect(() => {
    setDoctor(initialDoctor);
  }, [initialDoctor, setDoctor]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setSuccess('');
    setError(null);
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess('');
    setError(null);

    startTransition(async () => {
      const res = await updateDoctorProfile({
        name: formState.name,
        specialty: formState.specialty,
        clinic: formState.clinic,
        phone: formState.phone || undefined,
        avatar: formState.avatar || undefined,
      });

      if (res.success && res.data) {
        setSuccess('Profile successfully updated.');
        setCurrentDoctor(res.data);
        setDoctor(res.data);
      } else {
        setError(res.error || 'Failed to update doctor profile.');
      }
    });
  };

  const handleReload = () => {
    startTransition(() => {
      router.refresh();
    });
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
        <DoctorSettingsForm
          formState={formState}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReload={handleReload}
          isSaving={isPending}
          isLoading={isPending}
        />

        <DoctorSettingsPreview
          formState={formState}
          doctorAvatar={currentDoctor.avatar}
          doctorName={currentDoctor.name}
          doctorSpecialty={currentDoctor.specialty}
          doctorClinic={currentDoctor.clinic}
          doctorPhone={currentDoctor.phone}
        />
      </div>
    </div>
  );
}
