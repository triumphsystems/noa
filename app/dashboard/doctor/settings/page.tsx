'use client';

import React, { useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import {
  DoctorSettingsForm,
  DoctorSettingsPreview,
  DEFAULT_SETTINGS_FORM,
  type SettingsFormState,
} from '@/components/doctor/settings';

export default function DoctorSettingsPage() {
  const doctor = useDoctorStore((state) => state.doctor);
  const doctorId = useDoctorStore((state) => state.doctorId);
  const isSaving = useDoctorStore((state) => state.isSaving);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const error = useDoctorStore((state) => state.error);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);
  const updateDoctorProfile = useDoctorStore((state) => state.updateDoctorProfile);

  const [formState, setFormState] = useState<SettingsFormState>(DEFAULT_SETTINGS_FORM);
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
      setSuccess('Profile successfully updated.');
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
        <DoctorSettingsForm
          formState={formState}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReload={() => doctorId && void loadDashboard(doctorId)}
          isSaving={isSaving}
          isLoading={isLoading}
        />

        <DoctorSettingsPreview
          formState={formState}
          doctorAvatar={doctor?.avatar}
          doctorName={doctor?.name}
          doctorSpecialty={doctor?.specialty}
          doctorClinic={doctor?.clinic}
          doctorPhone={doctor?.phone}
        />
      </div>
    </div>
  );
}
