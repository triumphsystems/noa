'use client';

import React, { useEffect, useState } from 'react';
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

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const doctor = useDoctorStore((state) => state.doctor);
  const doctorId = useDoctorStore((state) => state.doctorId);
  const setDoctorId = useDoctorStore((state) => state.setDoctorId);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);
  const updateDoctorProfile = useDoctorStore(
    (state) => state.updateDoctorProfile
  );

  const [formData, setFormData] = useState<DoctorOnboardingFormData>({
    name: '',
    specialty: '',
    clinic: '',
    phone: '',
    license: '',
    issuingAuthority: '',
    licenseDocumentUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certified, setCertified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
    null
  );
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedDoctorId =
      window.localStorage.getItem('userId') ||
      window.localStorage.getItem('doctorId');
    const activeId = storedDoctorId || doctorId;
    if (activeId) {
      if (activeId !== doctorId) {
        setDoctorId(activeId);
      }
      void loadDashboard(activeId);
    }
  }, [doctorId, loadDashboard, setDoctorId]);

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        specialty: doctor.specialty || '',
        clinic: doctor.clinic || '',
        phone: doctor.phone || '',
        license:
          doctor.license && doctor.license !== 'LICENSE-PENDING'
            ? doctor.license
            : '',
        issuingAuthority: doctor.issuingAuthority || '',
        licenseDocumentUrl: doctor.licenseDocumentUrl || '',
      });

      if (
        doctor.verificationStatus === 'rejected' ||
        !doctor.license ||
        doctor.license === 'LICENSE-PENDING' ||
        !doctor.licenseDocumentUrl
      ) {
        setShowEditForm(true);
      }
    }
  }, [doctor]);

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

  const handleUploadDocument = async (): Promise<string | null> => {
    if (!selectedFile || !doctorId) return formData.licenseDocumentUrl || null;
    setUploadingFile(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);

      const response = await fetch(
        `/api/doctors/${encodeURIComponent(doctorId)}/license`,
        {
          method: 'POST',
          body: uploadData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      setFormData((prev) => ({
        ...prev,
        licenseDocumentUrl: data.licenseDocumentUrl,
      }));
      return data.licenseDocumentUrl;
    } catch (err) {
      console.error('Document upload error:', err);
      throw err;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setStatusMessage({
        type: 'error',
        text: 'No active doctor session found. Please sign in.',
      });
      return;
    }

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

    if (!certified && doctor?.verificationStatus !== 'verified') {
      setStatusMessage({
        type: 'error',
        text: 'Please certify that the clinical information provided is accurate and verifiable.',
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      let finalDocUrl = formData.licenseDocumentUrl;
      if (selectedFile) {
        const uploadedUrl = await handleUploadDocument();
        if (uploadedUrl) finalDocUrl = uploadedUrl;
      }

      const result = await updateDoctorProfile({
        name: formData.name,
        specialty: formData.specialty,
        clinic: formData.clinic,
        phone: formData.phone,
        license: formData.license,
        issuingAuthority: formData.issuingAuthority,
        licenseDocumentUrl: finalDocUrl,
        verificationStatus: 'pending',
      });

      if (result) {
        setStatusMessage({
          type: 'success',
          text: 'Credentials submitted successfully. Your application is now queued for clinical administration review.',
        });
        setSelectedFile(null);
        setShowEditForm(false);
        if (doctorId) {
          void loadDashboard(doctorId);
        }
      } else {
        throw new Error(
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

  const verificationStatus = doctor?.verificationStatus || 'pending';
  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 font-sans sm:p-6 lg:p-10">
      <OnboardingHeader
        isVerified={isVerified}
        onCheckStatus={() => doctorId && void loadDashboard(doctorId)}
      />

      <VerificationStatusBanner
        status={verificationStatus}
        license={doctor?.license}
        issuingAuthority={doctor?.issuingAuthority}
        rejectionReason={doctor?.rejectionReason}
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
        !doctor?.license ||
        doctor?.license === 'LICENSE-PENDING') && (
        <OnboardingForm
          formData={formData}
          onChange={handleInputChange}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          certified={certified}
          onCertifiedChange={setCertified}
          submitting={submitting}
          uploadingFile={uploadingFile}
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
