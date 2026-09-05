'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HelpCircle,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import { cn } from '@/lib/utils';

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const doctor = useDoctorStore((state) => state.doctor);
  const doctorId = useDoctorStore((state) => state.doctorId);
  const setDoctorId = useDoctorStore((state) => state.setDoctorId);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);
  const updateDoctorProfile = useDoctorStore(
    (state) => state.updateDoctorProfile
  );

  const [formData, setFormData] = useState({
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
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Initialize doctor ID from local storage or store
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedDoctorId = window.localStorage.getItem('doctorId');
    const activeId = storedDoctorId || doctorId;
    if (activeId) {
      if (activeId !== doctorId) {
        setDoctorId(activeId);
      }
      void loadDashboard(activeId);
    }
  }, [doctorId, loadDashboard, setDoctorId]);

  // Sync loaded doctor data into form state
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

      // If rejected or pending with missing details, automatically show form
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
      // 1. Upload file if selected
      let finalDocUrl = formData.licenseDocumentUrl;
      if (selectedFile) {
        const uploadedUrl = await handleUploadDocument();
        if (uploadedUrl) finalDocUrl = uploadedUrl;
      }

      // 2. Submit updated credentials and reset status to pending review
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
      {/* Page Header */}
      <div className="border-deep-ink/10 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="bg-soft-meadow border-deep-ink/10 text-deep-ink inline-flex rounded-lg border p-1.5">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-deep-ink/75 font-sans text-xs font-semibold tracking-wider uppercase">
              Clinical Compliance & Credentialing
            </span>
          </div>
          <h1 className="text-deep-ink font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Doctor Licensure & Verification
          </h1>
          <p className="text-slate mt-1 max-w-2xl text-xs sm:text-sm">
            To ensure patient safety and HIPAA compliance, all healthcare
            providers must hold a verified medical license before accessing
            electronic health records and clinical consultation tools.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => doctorId && loadDashboard(doctorId)}
            className="gap-2 rounded-lg text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Status</span>
          </Button>
          {isVerified && (
            <Link href="/dashboard/doctor">
              <Button
                size="sm"
                variant="dark"
                className="gap-2 rounded-lg text-xs font-semibold"
              >
                <span>Enter Practice</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isPending && (
        <Card className="to-soft-meadow/40 border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white shadow-xs">
          <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100/80 text-amber-700">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800"
                  >
                    Review In Progress
                  </Badge>
                  <span className="text-slate/70 font-mono text-xs">
                    Status: Pending Approval
                  </span>
                </div>
                <h2 className="text-deep-ink font-serif text-lg font-bold sm:text-xl">
                  Your credentials are under clinical compliance review
                </h2>
                <p className="text-slate max-w-2xl text-xs leading-relaxed sm:text-sm">
                  Our credentialing committee validates license numbers against
                  state medical boards and international councils. Applications
                  are typically processed within 24 business hours.
                </p>
                {doctor?.license && doctor.license !== 'LICENSE-PENDING' && (
                  <div className="text-deep-ink/80 flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <span className="font-semibold">Submitted License:</span>
                    <span className="border-deep-ink/10 rounded border bg-white px-2 py-0.5 font-mono">
                      {doctor.license}
                    </span>
                    {doctor.issuingAuthority && (
                      <span className="text-slate">
                        ({doctor.issuingAuthority})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(!showEditForm)}
                className="rounded-lg text-xs font-semibold"
              >
                {showEditForm ? 'Hide Details' : 'Edit Credentials'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-rose-200 bg-rose-50/50 shadow-xs">
          <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-100 text-rose-700">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="danger" className="text-xs font-semibold">
                    Verification Rejected
                  </Badge>
                  <span className="font-mono text-xs text-rose-700">
                    Action Required
                  </span>
                </div>
                <h2 className="font-serif text-lg font-bold text-rose-950 sm:text-xl">
                  Your medical verification request requires revision
                </h2>
                <p className="max-w-2xl text-xs leading-relaxed text-rose-900/80 sm:text-sm">
                  The clinical compliance administrator was unable to verify
                  your credentials with the details provided.
                </p>
                {doctor?.rejectionReason && (
                  <div className="mt-3 space-y-1 rounded-xl border border-rose-200/80 bg-white p-3.5 text-xs text-rose-900">
                    <span className="block text-[10px] font-bold tracking-wider text-rose-950 uppercase">
                      Administrator Feedback:
                    </span>
                    <p className="leading-relaxed font-medium">
                      {doctor.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="dark"
              size="sm"
              onClick={() => setShowEditForm(true)}
              className="shrink-0 rounded-lg text-xs font-semibold"
            >
              Update & Resubmit
            </Button>
          </CardContent>
        </Card>
      )}

      {isVerified && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
          <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-600">
                    Verified Practitioner
                  </Badge>
                  <span className="font-mono text-xs text-emerald-800">
                    Clinical Privileges Active
                  </span>
                </div>
                <h2 className="text-deep-ink font-serif text-lg font-bold sm:text-xl">
                  Your medical license has been verified
                </h2>
                <p className="text-slate max-w-2xl text-xs leading-relaxed sm:text-sm">
                  Your account has full clinical documentation privileges,
                  ambient voice consultation access, and EHR export
                  capabilities.
                </p>
              </div>
            </div>

            <Link href="/dashboard/doctor">
              <Button
                variant="dark"
                size="sm"
                className="shrink-0 gap-2 rounded-lg text-xs font-semibold"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Feedback Messages */}
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

      {/* Credential Form */}
      {(showEditForm ||
        isRejected ||
        !doctor?.license ||
        doctor?.license === 'LICENSE-PENDING') && (
        <Card className="border-deep-ink/10 border bg-white shadow-xs">
          <CardHeader className="border-deep-ink/8 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-deep-ink font-serif text-lg font-bold">
                  {isRejected
                    ? 'Resubmit Credential Information'
                    : 'Medical Licensure & Practice Details'}
                </CardTitle>
                <CardDescription className="text-slate mt-0.5 text-xs">
                  Enter your official registration details exactly as they
                  appear on your state or national medical register.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-sans text-xs">
                Form Step 1 of 1
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Practitioner Identity */}
              <div className="space-y-4">
                <div className="text-slate border-deep-ink/5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-wider uppercase">
                  <Stethoscope className="text-deep-ink h-3.5 w-3.5" />
                  <span>1. Clinical Identity</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-deep-ink block text-xs font-semibold">
                      Full Legal Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                      className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-deep-ink block text-xs font-semibold">
                      Primary Clinical Specialty{' '}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Internal Medicine, Family Practice, Cardiology"
                      className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-deep-ink block text-xs font-semibold">
                      Clinic / Hospital Affiliation{' '}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="clinic"
                      value={formData.clinic}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. MetroHealth Medical Center"
                      className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-deep-ink block text-xs font-semibold">
                      Practice Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (555) 234-5678"
                      className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Medical Licensure */}
              <div className="space-y-4 pt-2">
                <div className="text-slate border-deep-ink/5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-wider uppercase">
                  <Shield className="text-deep-ink h-3.5 w-3.5" />
                  <span>2. State / National Medical Licensure</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-deep-ink block text-xs font-semibold">
                      Medical License / Registration Number{' '}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. C123456, GMC-7654321, NPI-1982734123"
                      className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 font-mono text-sm focus:ring-2 focus:outline-none"
                    />
                    <p className="text-slate text-[11px]">
                      Your primary state board license, GMC number, or medical
                      council registration.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-deep-ink block text-xs font-semibold">
                      Issuing Board / Regulatory Authority{' '}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="issuingAuthority"
                      value={formData.issuingAuthority}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Medical Board of California, GMC UK"
                      className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                    />
                    <p className="text-slate text-[11px]">
                      The official body responsible for issuing and verifying
                      your license.
                    </p>
                  </div>
                </div>

                {/* License Document Upload */}
                <div className="space-y-2 pt-2">
                  <label className="text-deep-ink block text-xs font-semibold">
                    Supporting Licensure Document / Certificate (PDF, PNG, JPG)
                  </label>

                  <div className="border-deep-ink/15 hover:border-deep-ink/30 bg-soft-meadow/30 rounded-2xl border-2 border-dashed p-6 text-center transition-colors">
                    <Upload className="text-slate mx-auto mb-2 h-8 w-8" />
                    <p className="text-deep-ink text-xs font-medium">
                      Upload your current medical license certificate or
                      registration letter
                    </p>
                    <p className="text-slate mt-0.5 text-[11px]">
                      PDF, JPG, or PNG up to 10MB
                    </p>

                    <input
                      type="file"
                      id="license-file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="mt-3 flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById('license-file')?.click()
                        }
                        className="cursor-pointer gap-1.5 rounded-lg text-xs font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Choose Document</span>
                      </Button>
                      {selectedFile && (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {selectedFile.name} (
                          {(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  {formData.licenseDocumentUrl && !selectedFile && (
                    <div className="bg-canvas border-deep-ink/10 flex items-center justify-between rounded-xl border p-3 text-xs">
                      <div className="text-deep-ink flex items-center gap-2 font-medium">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <span>Current document on file</span>
                      </div>
                      <a
                        href={formData.licenseDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate hover:text-deep-ink inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                      >
                        <span>View Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Professional Attestation */}
              {verificationStatus !== 'verified' && (
                <div className="bg-soft-meadow border-deep-ink/10 space-y-3 rounded-xl border p-4">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="certify-check"
                      checked={certified}
                      onChange={(e) => setCertified(e.target.checked)}
                      className="border-deep-ink/20 text-deep-ink focus:ring-deep-ink mt-0.5 rounded"
                    />
                    <label
                      htmlFor="certify-check"
                      className="text-deep-ink cursor-pointer text-xs leading-relaxed select-none"
                    >
                      <span className="font-semibold">
                        Professional Attestation:
                      </span>{' '}
                      I hereby certify under penalty of perjury that I am a duly
                      licensed medical practitioner authorized to practice in
                      the specified jurisdiction, and the credentials submitted
                      herein are authentic, active, and in good standing.
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="border-deep-ink/8 flex flex-col items-center justify-end gap-3 border-t pt-4 sm:flex-row">
                {showEditForm && isPending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditForm(false)}
                    className="w-full text-xs sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  variant="dark"
                  className="w-full gap-2 rounded-xl px-6 py-2.5 text-xs font-semibold shadow-xs sm:w-auto"
                >
                  {submitting || uploadingFile ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Submitting Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {isRejected
                          ? 'Resubmit for Admin Approval'
                          : 'Submit Credentials for Verification'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Compliance Help & FAQs */}
      <div className="text-slate grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
        <Card className="border-deep-ink/8 border bg-white/70 p-4">
          <div className="text-deep-ink mb-1 flex items-center gap-2 font-serif font-bold">
            <Building2 className="text-deep-ink h-4 w-4" />
            <span>Multi-Jurisdiction</span>
          </div>
          <p className="leading-relaxed">
            We accept active licenses from US State Medical Boards, UK GMC,
            Canadian Medical Councils, and recognized international authorities.
          </p>
        </Card>

        <Card className="border-deep-ink/8 border bg-white/70 p-4">
          <div className="text-deep-ink mb-1 flex items-center gap-2 font-serif font-bold">
            <ShieldCheck className="text-deep-ink h-4 w-4" />
            <span>HIPAA-Grade Security</span>
          </div>
          <p className="leading-relaxed">
            Credential documents are encrypted with AES-256 and accessible
            exclusively by designated clinical compliance administrators.
          </p>
        </Card>

        <Card className="border-deep-ink/8 border bg-white/70 p-4">
          <div className="text-deep-ink mb-1 flex items-center gap-2 font-serif font-bold">
            <HelpCircle className="text-deep-ink h-4 w-4" />
            <span>Expedited Review</span>
          </div>
          <p className="leading-relaxed">
            Need urgent clinical access for an ongoing hospital shift? Contact
            our medical compliance desk at{' '}
            <span className="text-deep-ink font-semibold">
              compliance@noa.health
            </span>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
