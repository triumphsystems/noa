'use client';

import React from 'react';
import { Loader2, Mail, Phone, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPopup className="max-w-md space-y-5">
        <div className="border-deep-ink/10 flex items-center gap-2 border-b pb-2">
          <div className="bg-soft-meadow text-deep-ink flex h-8 w-8 items-center justify-center rounded-lg">
            <UserPlus className="h-4 w-4" />
          </div>
          <DialogTitle>Add Patient Record</DialogTitle>
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
            <Input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="patient@example.com"
            />
            <DialogDescription className="text-[10px]">
              If the patient already has a Noa account, an invitation request
              will appear on their portal.
            </DialogDescription>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                <User className="text-slate h-3.5 w-3.5" />
                First Name
              </label>
              <Input
                type="text"
                value={inviteFirstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
                Last Name
              </label>
              <Input
                type="text"
                value={inviteLastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-deep-ink flex items-center gap-1.5 font-semibold">
              <Phone className="text-slate h-3.5 w-3.5" />
              Phone Number
            </label>
            <Input
              type="tel"
              value={invitePhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+1 (555) 000-0000"
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
      </DialogPopup>
    </Dialog>
  );
}
