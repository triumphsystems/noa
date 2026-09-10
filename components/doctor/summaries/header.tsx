'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SummariesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function SummariesHeader({ isLoading, onRefresh }: SummariesHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-deep-ink mb-1 font-serif text-2xl font-bold sm:text-3xl">
          Clinical Summaries
        </h1>
        <p className="text-slate text-xs sm:text-sm">
          Review, verify, and export live consultation notes and SOAP assessments
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="border-deep-ink/15 cursor-pointer gap-2 self-start rounded-xl text-xs font-semibold sm:self-auto"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </Button>
    </div>
  );
}
