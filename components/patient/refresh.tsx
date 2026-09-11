'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { refreshPatientDashboard } from '@/app/dashboard/patient/actions';
import { cn } from '@/lib/utils';

export function PatientRefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshPatientDashboard();
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleRefresh}
      disabled={isPending}
      title="Refresh Data"
      aria-label="Refresh Data"
      className={cn(
        'text-slate hover:text-deep-ink hover:bg-soft-meadow cursor-pointer transition-colors',
        className
      )}
    >
      <RefreshCw
        className={cn(
          'h-4 w-4 transition-all',
          isPending && 'text-deep-ink animate-spin'
        )}
      />
    </Button>
  );
}
