'use client';

import React, { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CareCodeBannerProps {
  careCode: string;
}

export function CareCodeBanner({ careCode }: CareCodeBannerProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCareCode = () => {
    if (typeof navigator !== 'undefined') {
      void navigator.clipboard.writeText(careCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyIntakeLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/intake?doctorCode=${encodeURIComponent(careCode)}`;
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <Card className="border-deep-ink/10 bg-canvas/40 flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 backdrop-blur-sm sm:p-5 md:flex-row md:items-center">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-slate text-xs font-semibold tracking-wider uppercase">
            Your Doctor Care Code:
          </span>
          <span className="border-deep-ink/10 text-deep-ink rounded-md border bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-widest shadow-2xs">
            {careCode}
          </span>
        </div>
        <p className="text-slate text-xs">
          Patients can enter this code in their portal or start an intake directly with your pre-configured link.
        </p>
      </div>

      <div className="flex w-full items-center gap-2 md:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={copyCareCode}
          className="border-deep-ink/15 hover:border-deep-ink/30 flex-1 cursor-pointer gap-1.5 rounded-full text-xs md:flex-initial"
        >
          {copiedCode ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyIntakeLink}
          className="border-deep-ink/15 hover:border-deep-ink/30 flex-1 cursor-pointer gap-1.5 rounded-full text-xs md:flex-initial"
        >
          {copiedLink ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          <span>{copiedLink ? 'Link Copied!' : 'Share Intake Link'}</span>
        </Button>
      </div>
    </Card>
  );
}
