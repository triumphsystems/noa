'use client';

import React from 'react';
import { Building2, HelpCircle, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ComplianceCards() {
  return (
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
          Need urgent clinical access for an ongoing hospital shift? Contact our
          medical compliance desk at{' '}
          <span className="text-deep-ink font-semibold">
            compliance@noa.health
          </span>
          .
        </p>
      </Card>
    </div>
  );
}
