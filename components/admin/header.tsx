import { Button } from '@/components/ui/button';
import { Download, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminUser } from './types';
import { getDoctorInitials } from './types';

interface AdminHeaderProps {
  adminUser: AdminUser | null;
  loading: boolean;
  refreshing: boolean;
  doctorsCount: number;
  lastUpdated: Date;
  onRefresh: () => void;
  onExport: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  adminUser,
  loading,
  refreshing,
  doctorsCount,
  lastUpdated,
  onRefresh,
  onExport,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="border-deep-ink/10 sticky top-0 z-30 border-b bg-white/85 px-4 py-3.5 backdrop-blur-md transition-shadow sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Brand & Console Title */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Noa Logo"
            className="h-9 w-9 shrink-0 rounded-xl shadow-2xs"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-deep-ink font-serif text-xl font-bold tracking-tight">
                Noa
              </span>
              <span className="bg-soft-meadow text-deep-ink border-deep-ink/10 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                Superadmin Console
              </span>
              <span className="bg-canvas text-deep-ink/80 border-deep-ink/10 hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Clinical Governance Gateway
              </span>
            </div>
            <p className="text-slate mt-0.5 text-xs font-medium">
              Clinician Verification & Medical Practice Governance
            </p>
          </div>
        </div>

        {/* Right Controls: User Profile, CSV Export, Refresh, Logout */}
        <div className="flex flex-wrap items-center justify-between gap-2 self-stretch sm:justify-end sm:self-auto">
          <div className="bg-soft-meadow border-deep-ink/10 hidden items-center gap-2 rounded-xl border px-3 py-1.5 text-xs md:flex">
            <div className="text-deep-ink border-deep-ink/10 flex h-6 w-6 items-center justify-center rounded-full border bg-white font-serif text-[10px] font-bold">
              {adminUser?.name ? getDoctorInitials(adminUser.name) : 'SA'}
            </div>
            <div className="text-left">
              <span className="text-deep-ink block max-w-[130px] truncate font-semibold">
                {adminUser?.name || 'Administrator'}
              </span>
              <span className="text-slate block text-[10px]">
                Admins Cognito Group
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={loading || doctorsCount === 0}
            className="text-deep-ink border-deep-ink/10 hover:bg-soft-meadow shadow-editorial h-9 gap-1.5 bg-white text-xs"
            title="Download full clinician audit log as CSV"
          >
            <Download className="text-slate h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Audit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-deep-ink border-deep-ink/10 hover:bg-soft-meadow shadow-editorial h-9 gap-1.5 bg-white text-xs"
            title={`Last refreshed: ${lastUpdated.toLocaleTimeString()}`}
          >
            <RefreshCw
              className={cn(
                'text-slate h-3.5 w-3.5',
                refreshing && 'text-deep-ink animate-spin'
              )}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-9 gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
