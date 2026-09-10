import { CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminMetricsProps {
  counts: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
  activeTab: 'pending' | 'verified' | 'rejected' | 'all';
  onTabChange: (tab: 'pending' | 'verified' | 'rejected' | 'all') => void;
}

export function AdminMetrics({
  counts,
  activeTab,
  onTabChange,
}: AdminMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      {/* Pending */}
      <div
        onClick={() => onTabChange('pending')}
        role="button"
        tabIndex={0}
        className={cn(
          'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
          activeTab === 'pending'
            ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-amber-50/20 ring-2'
            : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
            Pending Review
          </span>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 text-amber-800 sm:h-8 sm:w-8">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
          <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
            {counts.pending}
          </span>
          {counts.pending > 0 && (
            <span className="py-0.2 rounded-full border border-amber-300/40 bg-amber-200/50 px-1.5 text-[10px] font-semibold text-amber-900 sm:px-2 sm:py-0.5 sm:text-[11px]">
              Action
            </span>
          )}
        </div>
        <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
          Awaiting review
        </p>
        {activeTab === 'pending' && (
          <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
        )}
      </div>

      {/* Verified */}
      <div
        onClick={() => onTabChange('verified')}
        role="button"
        tabIndex={0}
        className={cn(
          'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
          activeTab === 'verified'
            ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-emerald-50/20 ring-2'
            : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
            Verified
          </span>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800 sm:h-8 sm:w-8">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
          <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
            {counts.verified}
          </span>
          <span className="py-0.2 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-800 sm:px-2 sm:py-0.5 sm:text-[11px]">
            Active
          </span>
        </div>
        <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
          Active licensed
        </p>
        {activeTab === 'verified' && (
          <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
        )}
      </div>

      {/* Rejected */}
      <div
        onClick={() => onTabChange('rejected')}
        role="button"
        tabIndex={0}
        className={cn(
          'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
          activeTab === 'rejected'
            ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-rose-50/20 ring-2'
            : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
            Revoked
          </span>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100/80 text-rose-800 sm:h-8 sm:w-8">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
          <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
            {counts.rejected}
          </span>
          {counts.rejected > 0 && (
            <span className="py-0.2 rounded-full border border-rose-200 bg-rose-100 px-1.5 text-[10px] font-semibold text-rose-800 sm:px-2 sm:py-0.5 sm:text-[11px]">
              Restricted
            </span>
          )}
        </div>
        <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
          Revoked access
        </p>
        {activeTab === 'rejected' && (
          <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
        )}
      </div>

      {/* Total */}
      <div
        onClick={() => onTabChange('all')}
        role="button"
        tabIndex={0}
        className={cn(
          'group shadow-editorial relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all sm:rounded-2xl sm:p-5',
          activeTab === 'all'
            ? 'border-deep-ink ring-deep-ink/10 shadow-editorial-elevated bg-soft-meadow/40 ring-2'
            : 'border-deep-ink/8 hover:border-deep-ink/20 hover:shadow-editorial-elevated'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
            Total
          </span>
          <div className="bg-soft-meadow text-deep-ink border-deep-ink/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border sm:h-8 sm:w-8">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:mt-3 sm:gap-2">
          <span className="text-deep-ink font-serif text-2xl font-medium sm:text-3xl">
            {counts.total}
          </span>
          <span className="text-slate bg-soft-meadow py-0.2 border-deep-ink/10 rounded-full border px-1.5 text-[10px] font-medium sm:px-2 sm:py-0.5 sm:text-[11px]">
            All
          </span>
        </div>
        <p className="text-slate mt-1 truncate text-[11px] sm:text-xs">
          All clinicians
        </p>
        {activeTab === 'all' && (
          <div className="bg-deep-ink absolute right-0 bottom-0 left-0 h-1" />
        )}
      </div>
    </div>
  );
}
