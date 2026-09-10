'use client';

import React from 'react';
import {
  ExternalLink,
  FileCheck,
  FileText,
  Shield,
  ShieldCheck,
  Stethoscope,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DoctorOnboardingFormData } from './types';

interface OnboardingFormProps {
  formData: DoctorOnboardingFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selectedFile: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  certified: boolean;
  onCertifiedChange: (checked: boolean) => void;
  submitting: boolean;
  uploadingFile: boolean;
  isRejected: boolean;
  isPending: boolean;
  isVerified: boolean;
  showEditForm: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function OnboardingForm({
  formData,
  onChange,
  selectedFile,
  onFileSelect,
  certified,
  onCertifiedChange,
  submitting,
  uploadingFile,
  isRejected,
  isPending,
  isVerified,
  showEditForm,
  onCancel,
  onSubmit,
}: OnboardingFormProps) {
  return (
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
              Enter your official registration details exactly as they appear on your state or national medical register.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-sans text-xs">
            Form Step 1 of 1
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
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
                  onChange={onChange}
                  required
                  placeholder="e.g. Dr. Sarah Jenkins, MD"
                  className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Primary Clinical Specialty <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={onChange}
                  required
                  placeholder="e.g. Internal Medicine, Family Practice, Cardiology"
                  className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Clinic / Hospital Affiliation <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="clinic"
                  value={formData.clinic}
                  onChange={onChange}
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
                  onChange={onChange}
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
                  Medical License / Registration Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="license"
                  value={formData.license}
                  onChange={onChange}
                  required
                  placeholder="e.g. C123456, GMC-7654321, NPI-1982734123"
                  className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 font-mono text-sm focus:ring-2 focus:outline-none"
                />
                <p className="text-slate text-[11px]">
                  Your primary state board license, GMC number, or medical council registration.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Issuing Board / Regulatory Authority <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="issuingAuthority"
                  value={formData.issuingAuthority}
                  onChange={onChange}
                  required
                  placeholder="e.g. Medical Board of California, GMC UK"
                  className="border-deep-ink/15 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                />
                <p className="text-slate text-[11px]">
                  The official body responsible for issuing and verifying your license.
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
                  Upload your current medical license certificate or registration letter
                </p>
                <p className="text-slate mt-0.5 text-[11px]">PDF, JPG, or PNG up to 10MB</p>

                <input
                  type="file"
                  id="license-file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={onFileSelect}
                  className="hidden"
                />

                <div className="mt-3 flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('license-file')?.click()}
                    className="cursor-pointer gap-1.5 rounded-lg text-xs font-medium"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Choose Document</span>
                  </Button>
                  {selectedFile && (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
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
          {!isVerified && (
            <div className="bg-soft-meadow border-deep-ink/10 space-y-3 rounded-xl border p-4">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="certify-check"
                  checked={certified}
                  onChange={(e) => onCertifiedChange(e.target.checked)}
                  className="border-deep-ink/20 text-deep-ink focus:ring-deep-ink mt-0.5 rounded"
                />
                <label
                  htmlFor="certify-check"
                  className="text-deep-ink cursor-pointer text-xs leading-relaxed select-none"
                >
                  <span className="font-semibold">Professional Attestation:</span> I hereby certify
                  under penalty of perjury that I am a duly licensed medical practitioner
                  authorized to practice in the specified jurisdiction, and the credentials
                  submitted herein are authentic, active, and in good standing.
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
                onClick={onCancel}
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
  );
}
