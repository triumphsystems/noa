'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  KeyRound,
  Search,
  Stethoscope,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import type { Doctor } from '@/lib/db';
import { DoctorInvitationBanner } from './invitation';
import { DoctorDirectorySearch } from './search';

import {
  respondToDoctorLink,
  connectDoctor,
} from '@/app/dashboard/patient/actions';

interface DoctorConnectCardProps {
  pendingDoctor?: Doctor | null;
  linkStatus?: string;
  onRefresh: () => Promise<void>;
}

export function DoctorConnectCard({
  pendingDoctor,
  linkStatus,
  onRefresh,
}: DoctorConnectCardProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'directory'>('code');
  const [careCodeInput, setCareCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Handle accepting or declining an invitation from a doctor
  const handleRespondInvitation = async (action: 'accept' | 'decline') => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await respondToDoctorLink(action);
      if (!res.success) {
        throw new Error(res.error || 'Failed to respond to invitation');
      }
      setFeedback({ type: 'success', message: res.data?.message || 'Invitation processed.' });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle direct connect with Care Code or Doctor Email
  const handleConnectByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careCodeInput.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await connectDoctor({ careCode: careCodeInput.trim() });
      if (!res.success) {
        throw new Error(res.error || 'Doctor not found with this code');
      }
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Connected successfully!',
      });
      setCareCodeInput('');
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Connect to doctor clicked in directory
  const handleConnectToDoctor = async (doctorId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await connectDoctor({ doctorId });
      if (!res.success) throw new Error(res.error || 'Connection failed');
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Connected successfully!',
      });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-deep-ink/10 space-y-6 rounded-2xl border bg-white/95 p-6 shadow-xs backdrop-blur-sm">
      {linkStatus === 'pending_patient_approval' && pendingDoctor && (
        <DoctorInvitationBanner
          pendingDoctor={pendingDoctor}
          isSubmitting={isSubmitting}
          onRespond={handleRespondInvitation}
        />
      )}

      <div>
        <div className="mb-1.5 flex items-center gap-2.5">
          <div className="bg-soft-meadow text-deep-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Stethoscope className="h-4 w-4" />
          </div>
          <h3 className="text-deep-ink font-serif text-lg font-bold">
            Connect to Your Physician
          </h3>
        </div>
        <p className="text-slate text-xs sm:text-sm">
          Link your portal with your healthcare provider to enable clinical
          review of your health records, AI intake sessions, and consultation
          notes.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs ${
            feedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="border-deep-ink/10 flex gap-6 border-b text-xs font-semibold">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex cursor-pointer items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'code'
              ? 'text-deep-ink border-deep-ink border-b-2'
              : 'text-slate hover:text-deep-ink'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Enter Care Code / Doctor Email
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex cursor-pointer items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'directory'
              ? 'text-deep-ink border-deep-ink border-b-2'
              : 'text-slate hover:text-deep-ink'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          Browse Directory
        </button>
      </div>

      {activeTab === 'code' ? (
        <form onSubmit={handleConnectByCode} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-deep-ink flex items-center gap-1.5 text-xs font-semibold">
              Doctor Care Code or Email
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={careCodeInput}
                onChange={(e) => setCareCodeInput(e.target.value)}
                placeholder="e.g. NOA-7492AB or doctor@clinic.com"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !careCodeInput.trim()}
                className="bg-deep-ink text-canvas hover:bg-deep-ink/90 shrink-0 cursor-pointer rounded-xl px-5 text-xs font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>
          <p className="text-slate text-[11px]">
            Ask your doctor or clinic for their 6-character Noa Care Code or
            registered clinical email.
          </p>
        </form>
      ) : (
        <DoctorDirectorySearch
          onConnect={handleConnectToDoctor}
          isSubmitting={isSubmitting}
        />
      )}
    </Card>
  );
}
