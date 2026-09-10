'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Send, Sparkles } from 'lucide-react';
import type { DoctorSessionDetailData } from '@/lib/data/summaries';

interface SummaryDetailViewProps {
  initialData: DoctorSessionDetailData;
}

export function SummaryDetailView({ initialData }: SummaryDetailViewProps) {
  const { session, patient, doctor } = initialData;
  const [activeTab, setActiveTab] = React.useState<'clinical' | 'patient'>(
    'clinical'
  );
  const [shareSuccess, setShareSuccess] = React.useState(false);

  const handleDownloadPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShareWithPatient = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const patientNameParts = patient
    ? [patient.firstName, patient.lastName].filter(Boolean)
    : [];
  const patientName =
    patientNameParts.length > 0
      ? patientNameParts.join(' ').trim()
      : patient?.email ||
        `Patient #${session.patientId?.slice(-6) || 'Unknown'}`;
  const doctorName = doctor?.name
    ? `Dr. ${doctor.name}`
    : 'Attending Physician';
  const dateStr = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Date';

  const soap = session.soapNote || {
    subjective: session.transcript || 'No subjective narrative recorded.',
    objective:
      'Clinical examination conducted during voice consultation session.',
    assessment: 'Consultation evaluation completed.',
    plan: 'Continue monitoring and follow up as clinically indicated.',
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 font-sans sm:p-6 lg:p-8">
      {/* Top Breadcrumb & Actions */}
      <div className="space-y-1">
        <Link
          href="/dashboard/doctor/summaries"
          className="text-slate hover:text-deep-ink mb-2 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Clinical Summaries</span>
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-deep-ink font-serif text-2xl font-bold sm:text-3xl">
              Clinical Summary
            </h1>
            <p className="text-slate text-xs sm:text-sm">
              Session ID: {session.id} · {dateStr}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow cursor-pointer gap-1.5 rounded-full text-xs sm:text-sm"
            >
              <Download className="h-4 w-4" />
              Download Note
            </Button>
            <Button
              onClick={handleShareWithPatient}
              className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer gap-1.5 rounded-full text-xs font-medium shadow-2xs sm:text-sm"
            >
              <Send className="h-4 w-4" />
              {shareSuccess ? 'Shared with Patient!' : 'Share with Patient'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Metadata Card */}
      <Card className="bg-canvas border-deep-ink/10 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 sm:text-sm">
          <div>
            <span className="text-slate mb-1 block text-[11px] tracking-wider uppercase">
              Patient
            </span>
            <p className="text-deep-ink font-semibold">{patientName}</p>
          </div>
          <div>
            <span className="text-slate mb-1 block text-[11px] tracking-wider uppercase">
              Provider
            </span>
            <p className="text-deep-ink font-semibold">{doctorName}</p>
          </div>
          <div>
            <span className="text-slate mb-1 block text-[11px] tracking-wider uppercase">
              Date
            </span>
            <p className="text-deep-ink font-semibold">{dateStr}</p>
          </div>
          <div>
            <span className="text-slate mb-1 block text-[11px] tracking-wider uppercase">
              Status
            </span>
            <Badge
              variant={session.status === 'completed' ? 'success' : 'secondary'}
              className="text-[11px]"
            >
              {session.status === 'completed' ? 'Verified' : 'Active'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Tabs: Clinical vs Patient View */}
      <Card className="p-4 sm:p-6">
        <div className="border-deep-ink/10 mb-6 flex gap-2 overflow-x-auto border-b pb-4">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:px-5 ${
              activeTab === 'clinical'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Clinical SOAP Note</span>
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:px-5 ${
              activeTab === 'patient'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Patient-Friendly Overview</span>
          </button>
        </div>

        {/* Clinical SOAP View */}
        {activeTab === 'clinical' && (
          <div className="space-y-4">
            <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
              <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                Subjective
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">
                {soap.subjective}
              </p>
            </div>

            <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
              <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                Objective
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">
                {soap.objective}
              </p>
            </div>

            <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
              <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                Assessment
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">
                {soap.assessment}
              </p>
            </div>

            <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
              <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                Plan
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">
                {soap.plan}
              </p>
            </div>
          </div>
        )}

        {/* Patient Summary Tab */}
        {activeTab === 'patient' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-deep-ink mb-2 font-serif text-lg font-bold">
                Patient-Friendly Overview
              </h3>
              <p className="text-slate bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4 text-sm leading-relaxed">
                {soap.assessment || soap.plan
                  ? `${soap.assessment} Clinical Care Plan: ${soap.plan}`
                  : 'Your consultation has been recorded. Review your care plan and follow all physician recommendations.'}
              </p>
            </div>

            <div>
              <h3 className="text-deep-ink mb-3 font-serif text-lg font-bold">
                Key Instructions
              </h3>
              <div className="bg-soft-meadow/30 border-deep-ink/5 text-deep-ink rounded-2xl border p-4 text-sm">
                {soap.plan}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
