'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import { cn } from '@/lib/utils'

export default function DoctorOnboardingPage() {
  const router = useRouter()
  const doctor = useDoctorStore(state => state.doctor)
  const doctorId = useDoctorStore(state => state.doctorId)
  const setDoctorId = useDoctorStore(state => state.setDoctorId)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)
  const updateDoctorProfile = useDoctorStore(state => state.updateDoctorProfile)

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    clinic: '',
    phone: '',
    license: '',
    issuingAuthority: '',
    licenseDocumentUrl: '',
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [certified, setCertified] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  // Initialize doctor ID from local storage or store
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedDoctorId = window.localStorage.getItem('doctorId')
    const activeId = storedDoctorId || doctorId
    if (activeId) {
      if (activeId !== doctorId) {
        setDoctorId(activeId)
      }
      void loadDashboard(activeId)
    }
  }, [doctorId, loadDashboard, setDoctorId])

  // Sync loaded doctor data into form state
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        specialty: doctor.specialty || '',
        clinic: doctor.clinic || '',
        phone: doctor.phone || '',
        license: doctor.license && doctor.license !== 'LICENSE-PENDING' ? doctor.license : '',
        issuingAuthority: doctor.issuingAuthority || '',
        licenseDocumentUrl: doctor.licenseDocumentUrl || '',
      })

      // If rejected or pending with missing details, automatically show form
      if (
        doctor.verificationStatus === 'rejected' ||
        !doctor.license ||
        doctor.license === 'LICENSE-PENDING' ||
        !doctor.licenseDocumentUrl
      ) {
        setShowEditForm(true)
      }
    }
  }, [doctor])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'File exceeds 10MB limit. Please upload a smaller PDF or image.' })
        return
      }
      setSelectedFile(file)
      setStatusMessage(null)
    }
  }

  const handleUploadDocument = async (): Promise<string | null> => {
    if (!selectedFile || !doctorId) return formData.licenseDocumentUrl || null
    setUploadingFile(true)

    try {
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)

      const response = await fetch(`/api/doctors/${encodeURIComponent(doctorId)}/license`, {
        method: 'POST',
        body: uploadData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document')
      }

      setFormData(prev => ({ ...prev, licenseDocumentUrl: data.licenseDocumentUrl }))
      return data.licenseDocumentUrl
    } catch (err) {
      console.error('Document upload error:', err)
      throw err
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId) {
      setStatusMessage({ type: 'error', text: 'No active doctor session found. Please sign in.' })
      return
    }

    if (!formData.license.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your medical license number.' })
      return
    }

    if (!formData.issuingAuthority.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify the issuing medical licensing authority or board.' })
      return
    }

    if (!certified && doctor?.verificationStatus !== 'verified') {
      setStatusMessage({
        type: 'error',
        text: 'Please certify that the clinical information provided is accurate and verifiable.',
      })
      return
    }

    setSubmitting(true)
    setStatusMessage(null)

    try {
      // 1. Upload file if selected
      let finalDocUrl = formData.licenseDocumentUrl
      if (selectedFile) {
        const uploadedUrl = await handleUploadDocument()
        if (uploadedUrl) finalDocUrl = uploadedUrl
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
      })

      if (result) {
        setStatusMessage({
          type: 'success',
          text: 'Credentials submitted successfully. Your application is now queued for clinical administration review.',
        })
        setSelectedFile(null)
        setShowEditForm(false)
        if (doctorId) {
          void loadDashboard(doctorId)
        }
      } else {
        throw new Error('Failed to update credentials. Please check your connection and try again.')
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred during submission',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const verificationStatus = doctor?.verificationStatus || 'pending'
  const isVerified = verificationStatus === 'verified'
  const isPending = verificationStatus === 'pending'
  const isRejected = verificationStatus === 'rejected'

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-deep-ink/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-soft-meadow border border-deep-ink/10 text-deep-ink inline-flex">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-deep-ink/75 uppercase tracking-wider font-sans">
              Clinical Compliance & Credentialing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink tracking-tight">
            Doctor Licensure & Verification
          </h1>
          <p className="text-slate text-xs sm:text-sm mt-1 max-w-2xl">
            To ensure patient safety and HIPAA compliance, all healthcare providers must hold a verified medical license before accessing electronic health records and clinical consultation tools.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => doctorId && loadDashboard(doctorId)}
            className="rounded-lg gap-2 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Status</span>
          </Button>
          {isVerified && (
            <Link href="/dashboard/doctor">
              <Button size="sm" variant="dark" className="rounded-lg gap-2 text-xs font-semibold">
                <span>Enter Practice</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isPending && (
        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-soft-meadow/40 shadow-xs">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold">
                    Review In Progress
                  </Badge>
                  <span className="text-xs text-slate/70 font-mono">Status: Pending Approval</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-deep-ink">
                  Your credentials are under clinical compliance review
                </h2>
                <p className="text-slate text-xs sm:text-sm leading-relaxed max-w-2xl">
                  Our credentialing committee validates license numbers against state medical boards and international councils. Applications are typically processed within 24 business hours.
                </p>
                {doctor?.license && doctor.license !== 'LICENSE-PENDING' && (
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-deep-ink/80">
                    <span className="font-semibold">Submitted License:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-deep-ink/10">
                      {doctor.license}
                    </span>
                    {doctor.issuingAuthority && (
                      <span className="text-slate">({doctor.issuingAuthority})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="danger" className="text-xs font-semibold">
                    Verification Rejected
                  </Badge>
                  <span className="text-xs text-rose-700 font-mono">Action Required</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-rose-950">
                  Your medical verification request requires revision
                </h2>
                <p className="text-rose-900/80 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  The clinical compliance administrator was unable to verify your credentials with the details provided.
                </p>
                {doctor?.rejectionReason && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white border border-rose-200/80 text-xs text-rose-900 space-y-1">
                    <span className="font-bold block text-rose-950 uppercase tracking-wider text-[10px]">
                      Administrator Feedback:
                    </span>
                    <p className="font-medium leading-relaxed">{doctor.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="dark"
              size="sm"
              onClick={() => setShowEditForm(true)}
              className="rounded-lg text-xs font-semibold shrink-0"
            >
              Update & Resubmit
            </Button>
          </CardContent>
        </Card>
      )}

      {isVerified && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-semibold">
                    Verified Practitioner
                  </Badge>
                  <span className="text-xs text-emerald-800 font-mono">Clinical Privileges Active</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-deep-ink">
                  Your medical license has been verified
                </h2>
                <p className="text-slate text-xs sm:text-sm leading-relaxed max-w-2xl">
                  Your account has full clinical documentation privileges, ambient voice consultation access, and EHR export capabilities.
                </p>
              </div>
            </div>

            <Link href="/dashboard/doctor">
              <Button variant="dark" size="sm" className="rounded-lg gap-2 text-xs font-semibold shrink-0">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Feedback Messages */}
      {statusMessage && (
        <div
          className={cn(
            'p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 border animate-in fade-in',
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Credential Form */}
      {(showEditForm || isRejected || !doctor?.license || doctor?.license === 'LICENSE-PENDING') && (
        <Card className="border border-deep-ink/10 shadow-xs bg-white">
          <CardHeader className="pb-4 border-b border-deep-ink/8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-serif text-deep-ink">
                  {isRejected ? 'Resubmit Credential Information' : 'Medical Licensure & Practice Details'}
                </CardTitle>
                <CardDescription className="text-xs text-slate mt-0.5">
                  Enter your official registration details exactly as they appear on your state or national medical register.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-sans">
                Form Step 1 of 1
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Practitioner Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate border-b border-deep-ink/5 pb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-deep-ink" />
                  <span>1. Clinical Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep-ink">
                      Full Legal Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                      className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-sm focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep-ink">
                      Primary Clinical Specialty <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Internal Medicine, Family Practice, Cardiology"
                      className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-sm focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep-ink">
                      Clinic / Hospital Affiliation <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="clinic"
                      value={formData.clinic}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. MetroHealth Medical Center"
                      className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-sm focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep-ink">
                      Practice Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (555) 234-5678"
                      className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-sm focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Medical Licensure */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate border-b border-deep-ink/5 pb-2">
                  <Shield className="w-3.5 h-3.5 text-deep-ink" />
                  <span>2. State / National Medical Licensure</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep-ink">
                      Medical License / Registration Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. C123456, GMC-7654321, NPI-1982734123"
                      className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-sm font-mono focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 bg-white"
                    />
                    <p className="text-[11px] text-slate">
                      Your primary state board license, GMC number, or medical council registration.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep-ink">
                      Issuing Board / Regulatory Authority <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="issuingAuthority"
                      value={formData.issuingAuthority}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Medical Board of California, GMC UK"
                      className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-sm focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 bg-white"
                    />
                    <p className="text-[11px] text-slate">
                      The official body responsible for issuing and verifying your license.
                    </p>
                  </div>
                </div>

                {/* License Document Upload */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-deep-ink">
                    Supporting Licensure Document / Certificate (PDF, PNG, JPG)
                  </label>

                  <div className="border-2 border-dashed border-deep-ink/15 hover:border-deep-ink/30 rounded-2xl p-6 text-center transition-colors bg-soft-meadow/30">
                    <Upload className="w-8 h-8 text-slate mx-auto mb-2" />
                    <p className="text-xs font-medium text-deep-ink">
                      Upload your current medical license certificate or registration letter
                    </p>
                    <p className="text-[11px] text-slate mt-0.5">
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
                        onClick={() => document.getElementById('license-file')?.click()}
                        className="rounded-lg cursor-pointer text-xs font-medium gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Choose Document</span>
                      </Button>
                      {selectedFile && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  {formData.licenseDocumentUrl && !selectedFile && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-deep-ink/10 text-xs">
                      <div className="flex items-center gap-2 text-deep-ink font-medium">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>Current document on file</span>
                      </div>
                      <a
                        href={formData.licenseDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate hover:text-deep-ink inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Professional Attestation */}
              {verificationStatus !== 'verified' && (
                <div className="p-4 rounded-xl bg-soft-meadow border border-deep-ink/10 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="certify-check"
                      checked={certified}
                      onChange={e => setCertified(e.target.checked)}
                      className="mt-0.5 rounded border-deep-ink/20 text-deep-ink focus:ring-deep-ink"
                    />
                    <label htmlFor="certify-check" className="text-xs text-deep-ink leading-relaxed cursor-pointer select-none">
                      <span className="font-semibold">Professional Attestation:</span> I hereby certify under penalty of perjury that I am a duly licensed medical practitioner authorized to practice in the specified jurisdiction, and the credentials submitted herein are authentic, active, and in good standing.
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-deep-ink/8">
                {showEditForm && isPending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditForm(false)}
                    className="w-full sm:w-auto text-xs"
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  variant="dark"
                  className="w-full sm:w-auto rounded-xl px-6 py-2.5 text-xs font-semibold gap-2 shadow-xs"
                >
                  {submitting || uploadingFile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isRejected ? 'Resubmit for Admin Approval' : 'Submit Credentials for Verification'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Compliance Help & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate">
        <Card className="p-4 bg-white/70 border border-deep-ink/8">
          <div className="flex items-center gap-2 font-bold font-serif text-deep-ink mb-1">
            <Building2 className="w-4 h-4 text-deep-ink" />
            <span>Multi-Jurisdiction</span>
          </div>
          <p className="leading-relaxed">
            We accept active licenses from US State Medical Boards, UK GMC, Canadian Medical Councils, and recognized international authorities.
          </p>
        </Card>

        <Card className="p-4 bg-white/70 border border-deep-ink/8">
          <div className="flex items-center gap-2 font-bold font-serif text-deep-ink mb-1">
            <ShieldCheck className="w-4 h-4 text-deep-ink" />
            <span>HIPAA-Grade Security</span>
          </div>
          <p className="leading-relaxed">
            Credential documents are encrypted with AES-256 and accessible exclusively by designated clinical compliance administrators.
          </p>
        </Card>

        <Card className="p-4 bg-white/70 border border-deep-ink/8">
          <div className="flex items-center gap-2 font-bold font-serif text-deep-ink mb-1">
            <HelpCircle className="w-4 h-4 text-deep-ink" />
            <span>Expedited Review</span>
          </div>
          <p className="leading-relaxed">
            Need urgent clinical access for an ongoing hospital shift? Contact our medical compliance desk at <span className="font-semibold text-deep-ink">compliance@noa.health</span>.
          </p>
        </Card>
      </div>
    </div>
  )
}
