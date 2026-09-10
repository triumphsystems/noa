'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Home,
  CalendarDays,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PatientScreenTab } from './types';

interface PatientHeaderProps {
  patientName?: string;
  activeTab: PatientScreenTab;
  onTabChange: (tab: PatientScreenTab) => void;
  isLoading: boolean;
  onRefresh: () => void;
  sessionsCount: number;
  isPendingApproval: boolean;
}

export function PatientHeader({
  patientName,
  activeTab,
  onTabChange,
  isLoading,
  onRefresh,
  sessionsCount,
  isPendingApproval,
}: PatientHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tabs = [
    { id: 'home' as const, label: 'Overview', icon: Home },
    {
      id: 'visits' as const,
      label: 'Consultations',
      icon: CalendarDays,
      badge: sessionsCount || null,
    },
    {
      id: 'care-team' as const,
      label: 'Care Team',
      icon: Stethoscope,
      badge: isPendingApproval ? '1' : null,
    },
    { id: 'records' as const, label: 'Health Records', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4">
      {/* Top Page Action & Greeting Bar */}
      <div className="flex flex-col justify-between gap-4 pb-1 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-hi-yellow/30 border-hi-yellow/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-2xs">
            <Sparkles className="text-deep-ink h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-deep-ink font-serif text-xl font-bold sm:text-2xl">
                {getGreeting()},{' '}
                <span className="text-deep-ink">
                  {patientName || 'Patient'}
                </span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Active Portal
              </span>
            </div>
            <p className="text-slate text-xs">
              Your encrypted personal AI health records and consultation
              summaries
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Dashboard"
            aria-label="Refresh Dashboard"
            className="border-deep-ink/10 hover:bg-soft-meadow text-slate hover:text-deep-ink flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs shadow-2xs transition-colors"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5',
                isLoading && 'text-deep-ink animate-spin'
              )}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link href="/intake">
            <Button
              size="sm"
              className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 cursor-pointer gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Intake</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="border-deep-ink/8 hidden items-center gap-1.5 rounded-2xl border bg-white/80 p-1.5 shadow-2xs backdrop-blur-md sm:flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-deep-ink text-canvas shadow-xs'
                  : 'text-slate hover:text-deep-ink hover:bg-soft-meadow/60'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
                    isActive
                      ? 'bg-hi-yellow text-deep-ink'
                      : 'bg-amber-100 text-amber-900'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
