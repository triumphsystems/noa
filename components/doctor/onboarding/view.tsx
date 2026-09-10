'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import { cn } from '@/lib/utils';
import {
  OnboardingHeader,
  VerificationStatusBanner,
  OnboardingForm,
  ComplianceCards,
  type DoctorOnboardingFormData,
  type StatusMessage,
} from '@/components/doctor/onboarding';
import { submitLicensure } from '@/app/dashboard/doctor/actions';
import type { Doctor } from '@/lib/db';

interface DoctorOnboardingViewProps {
  initialDoctor: Doctor;
}

export function DoctorOnboardingView({
  initialDoctor,
}: DoctorOnboardingViewProps) {
  const router = useRouter();
  const [isPendingAction, startTransition] = useTransition();
  const setDoctor = useDoctorStore((state) => state.setDoctor);

  const [currentDoctor, setCurrentDoctor] = useState<Doctor>(initialDoctor);

  const [formData, setFormData] = useState<DoctorOnboardingFormData>({
    name: initialDoctor.name || '',
    specialty: initialDoctor.specialty || '',
    clinic: initialDoctor.clinic || '',
    phone: initialDoctor.phone || '',
    license:
      initialDoctor.license && initialDoctor.license !== 'LICENSE-PENDING'
        ? initialDoctor.license
        : '',
    issuingAuthority: initialDoctor.issuingAuthority || '',
    licenseDocumentUrl: initialDoctor.licenseDocumentUrl || '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [certified, setCertified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
    null
  );
  const [showEditForm, setShowEditForm] = useState(
    initialDoctor.verificationStatus === 'rejected' ||
      !initialDoctor.license ||
      initialDoctor.license === 'LICENSE-PENDING' ||
      !initialDoctor.licenseDocumentUrl
  );

  React.useEffect(() => {
    setDoctor(initialDoctor);
  }, [initialDoctor, setDoctor]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setStatusMessage({
          type: 'error',
          text: 'File exceeds 10MB limit. Please upload a smaller PDF or image.',
        });
        return;
      }
      setSelectedFile(file);
      setStatusMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.license.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your medical license number.',
      });
      return;
    }

    if (!formData.issuingAuthority.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please specify the issuing medical licensing authority or board.',
      });
      return;
    }

    if (!certified && currentDoctor.verificationStatus !== 'verified') {
      setStatusMessage({
        type: 'error',
        text: 'Please certify that the clinical information provided is accurate and verifiable.',
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await submitLicensure({
        name: formData.name,
        specialty: formData.specialty,
        clinic: formData.clinic,
        phone: formData.phone,
        license: formData.license,
        issuingAuthority: formData.issuingAuthority,
        licenseDocumentUrl: formData.licenseDocumentUrl,
        file: selectedFile,
      });

      if (res.success && res.doctor) {
        setStatusMessage({
          type: 'success',
          text:
            res.message ||
            'Credentials submitted successfully. Your application is now queued for clinical administration review.',
        });
        setSelectedFile(null);
        setShowEditForm(false);
        setCurrentDoctor(res.doctor);
        setDoctor(res.doctor);
        startTransition(() => {
          router.refresh();
        });
      } else {
        throw new Error(
          res.error ||
            'Failed to update credentials. Please check your connection and try again.'
        );
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'An error occurred during submission',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const verificationStatus = currentDoctor.verificationStatus || 'pending';
  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 font-sans sm:p-6 lg:p-10">
      <OnboardingHeader
        isVerified={isVerified}
        onCheckStatus={handleCheckStatus}
      />

      <VerificationStatusBanner
        status={verificationStatus}
        license={currentDoctor.license}
        issuingAuthority={currentDoctor.issuingAuthority}
        rejectionReason={currentDoctor.rejectionReason}
        showEditForm={showEditForm}
        onToggleEditForm={() => setShowEditForm(!showEditForm)}
        onOpenEditForm={() => setShowEditForm(true)}
      />

      {statusMessage && (
        <div
          className={cn(
            'animate-in fade-in flex items-center gap-3 rounded-xl border p-4 text-xs sm:text-sm',
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {(showEditForm ||
        isRejected ||
        !currentDoctor.license ||
        currentDoctor.license === 'LICENSE-PENDING') && (
        <OnboardingForm
          formData={formData}
          onChange={handleInputChange}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          certified={certified}
          onCertifiedChange={setCertified}
          submitting={submitting || isPendingAction}
          uploadingFile={false}
          isRejected={isRejected}
          isPending={isPending}
          isVerified={isVerified}
          showEditForm={showEditForm}
          onCancel={() => setShowEditForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ComplianceCards />
    </div>
  );
}
