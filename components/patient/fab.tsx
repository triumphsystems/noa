'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PatientFab() {
  const router = useRouter();

  return (
    <Button
      variant="default"
      size="icon-lg"
      onClick={() => router.push('/intake')}
      aria-label="Start New Voice Intake"
      className="fixed right-4 bottom-20 z-30 size-13 rounded-full shadow-lg ring-1 ring-deep-ink/10 transition-transform hover:scale-105 active:scale-95 sm:hidden"
    >
      <Plus className="size-6" />
    </Button>
  );
}
