'use client';

import React from 'react';
import { Loader2, Mail, Phone, User, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteEmail: string;
  onEmailChange: (v: string) => void;
  inviteFirstName: string;
  onFirstNameChange: (v: string) => void;
  inviteLastName: string;
  onLastNameChange: (v: string) => void;
  invitePhone: string;
  onPhoneChange: (v: string) => void;
  isSubmitting: boolean;
  inviteMessage: { type: 'success' | 'error'; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function InviteModal({
  isOpen,
  onClose,
  inviteEmail,
  onEmailChange,
  inviteFirstName,
  onFirstNameChange,
  inviteLastName,
  onLastNameChange,
  invitePhone,
  onPhoneChange,
  isSubmitting,
  inviteMessage,
  onSubmit,
}: InviteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="border-deep-ink/10 relative w-full max-w-md space-y-5 rounded-2xl border bg-white p-6 shadow-xl">
        <div className="border-deep-ink/10 flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-soft-meadow text-deep-ink flex h-8 w-8 items-center justify-center rounded-lg">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="text-deep-ink font-serif text-lg font-bold">
              Add Patient Record
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate hover:text-deep-ink cursor-pointer rounded-md p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {inviteMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
              inviteMessage.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <span>{inviteMessage.text}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
              <Mail className="text-slate h-3.5 w-3.5" />
              Email Address *
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="patient@example.com"
              className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
            />
            <p className="text-slate text-[10px]">
              If the patient already has a Noa account, an invitation request will appear on their portal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                <User className="text-slate h-3.5 w-3.5" />
                First Name
              </label>
              <input
                type="text"
                value={inviteFirstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                placeholder="Jane"
                className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                Last Name
              </label>
              <input
                type="text"
                value={inviteLastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                placeholder="Doe"
                className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
              <Phone className="text-slate h-3.5 w-3.5" />
              Phone Number
            </label>
            <input
              type="tel"
              value={invitePhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="border-deep-ink/15 text-deep-ink placeholder-slate/60 focus:border-deep-ink bg-canvas/30 w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !inviteEmail.trim()}
              className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer rounded-full px-5 text-xs font-medium shadow-2xs"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Add / Send Invite'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
