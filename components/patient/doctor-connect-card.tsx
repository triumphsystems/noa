'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Stethoscope,
  Mail,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { Doctor } from '@/lib/db';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
      const res = await fetch('/api/patients/respond-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to respond to invitation');
      }
      setFeedback({ type: 'success', message: data.message });
      await onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed' });
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
      const res = await fetch('/api/doctors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careCode: careCodeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Doctor not found with this code');
      }
      setFeedback({
        type: 'success',
        message: data.message || 'Connected successfully!',
      });
      setCareCodeInput('');
      await onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search doctors directory
  const handleSearchDirectory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/doctors/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setSearchResults(data.data || []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Directory search failed',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Connect to doctor clicked in directory
  const handleConnectToDoctor = async (doctorId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/doctors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Connection failed');
      setFeedback({
        type: 'success',
        message: data.message || 'Connected successfully!',
      });
      await onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-deep-ink/10 space-y-6 rounded-2xl border bg-white/95 p-6 shadow-xs backdrop-blur-sm">
      {/* 1. Pending Doctor Invitation Banner */}
      {linkStatus === 'pending_patient_approval' && pendingDoctor && (
        <div className="border-hi-yellow/40 bg-hi-yellow/10 animate-in fade-in space-y-4 rounded-xl border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-hi-yellow/20 text-deep-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-deep-ink font-serif text-base font-semibold">
                    Dr. {pendingDoctor.name} invited you to connect
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold tracking-wider uppercase"
                  >
                    Invitation
                  </Badge>
                </div>
                <p className="text-slate mt-1 text-xs">
                  Connecting allows Dr. {pendingDoctor.name} (
                  {pendingDoctor.clinic || pendingDoctor.specialty}) to review
                  your AI intake summaries and consultation notes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => handleRespondInvitation('accept')}
              disabled={isSubmitting}
              className="bg-deep-ink text-canvas hover:bg-deep-ink/90 h-auto cursor-pointer gap-1.5 rounded-full px-5 py-2 text-xs font-medium shadow-2xs"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Accept & Connect
            </Button>
            <Button
              onClick={() => handleRespondInvitation('decline')}
              disabled={isSubmitting}
              variant="outline"
              className="border-deep-ink/20 text-slate hover:text-deep-ink h-auto cursor-pointer gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
            >
              <XCircle className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* 2. Main Header & Description */}
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

      {/* Feedback Messages */}
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

      {/* Tabs: Care Code vs Directory */}
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
          onClick={() => {
            setActiveTab('directory');
            if (searchResults.length === 0) void handleSearchDirectory();
          }}
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

      {/* Tab 1: Code / Email Input */}
      {activeTab === 'code' && (
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
      )}

      {/* Tab 2: Directory Search */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchDirectory} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-slate absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name, specialty, or clinic..."
                className="pl-9"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              variant="outline"
              className="border-deep-ink/15 shrink-0 cursor-pointer rounded-xl px-4 text-xs font-medium"
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </form>

          {/* Search Results List */}
          <div className="divide-deep-ink/5 max-h-64 divide-y overflow-y-auto pr-1">
            {isSearching ? (
              <div className="text-slate py-8 text-center text-xs">
                Searching provider directory...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-slate py-8 text-center text-xs">
                No doctors found matching your query.
              </div>
            ) : (
              searchResults.map((doc) => (
                <div
                  key={doc.id}
                  className="hover:bg-soft-meadow/20 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-deep-ink truncate text-xs font-semibold sm:text-sm">
                        Dr. {doc.name}
                      </h4>
                      {doc.careCode && (
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {doc.careCode}
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate mt-0.5 flex items-center gap-3 text-[11px]">
                      {doc.specialty && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {doc.specialty}
                        </span>
                      )}
                      {doc.clinic && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3" />
                          {doc.clinic}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConnectToDoctor(doc.id)}
                    disabled={isSubmitting}
                    className="bg-deep-ink text-canvas hover:bg-deep-ink/90 h-auto shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium shadow-2xs"
                  >
                    Connect
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
