'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

import { useDoctorStore } from '@/lib/stores/doctor.store';
import { cn } from '@/lib/utils';

interface NavItemConfig {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresVerified?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    href: '/dashboard/doctor',
    icon: LayoutDashboard,
    label: 'Dashboard',
    requiresVerified: true,
  },
  {
    href: '/dashboard/doctor/sessions/new',
    icon: Mic,
    label: 'Sessions',
    requiresVerified: true,
  },
  {
    href: '/dashboard/doctor/patients',
    icon: Users,
    label: 'Patients',
    requiresVerified: true,
  },
  {
    href: '/dashboard/doctor/summaries',
    icon: FileText,
    label: 'Summaries',
    requiresVerified: true,
  },
  {
    href: '/dashboard/doctor/onboarding',
    icon: ShieldCheck,
    label: 'Licensure',
    requiresVerified: false,
  },
  {
    href: '/dashboard/doctor/settings',
    icon: Settings,
    label: 'Settings',
    requiresVerified: false,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const doctor = useDoctorStore((state) => state.doctor);
  const doctorId = useDoctorStore((state) => state.doctorId);
  const setDoctorId = useDoctorStore((state) => state.setDoctorId);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  const isVerified = doctor?.verificationStatus === 'verified';
  const isOnboardingRoute = pathname === '/dashboard/doctor/onboarding';

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedDoctorId = window.localStorage.getItem('doctorId');

    if (storedDoctorId && storedDoctorId !== doctorId) {
      setDoctorId(storedDoctorId);
      void loadDashboard(storedDoctorId);
      return;
    }

    if (storedDoctorId && !doctor && doctorId === storedDoctorId) {
      void loadDashboard(storedDoctorId);
    }
  }, [doctor, doctorId, loadDashboard, setDoctorId]);

  // Enforce doctor credential review lockout:
  // If doctor's medical license is under review or rejected, keep redirecting to onboarding
  useEffect(() => {
    if (
      doctor &&
      doctor.verificationStatus &&
      doctor.verificationStatus !== 'verified'
    ) {
      if (!isOnboardingRoute) {
        router.replace('/dashboard/doctor/onboarding');
      }
    }
  }, [doctor, isOnboardingRoute, router]);

  const doctorInitial = useMemo(() => {
    const source = doctor?.name?.trim() || 'Doctor';
    return source.charAt(0).toUpperCase();
  }, [doctor?.name]);

  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen flex-col md:h-dvh md:flex-row md:overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="bg-deep-ink/40 animate-in fade-in fixed inset-0 z-40 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Responsive Drawer on Mobile, Fixed/Sticky on Desktop) */}
      <aside
        className={cn(
          'bg-soft-meadow border-deep-ink/10 flex flex-col border-r transition-all duration-300',
          // Mobile: fixed off-canvas drawer
          'fixed inset-y-0 left-0 z-50 w-72 shadow-xl md:sticky md:top-0 md:z-30 md:h-full md:shrink-0 md:self-start md:shadow-none',
          mobileNavOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0',
          // Desktop: responsive width based on sidebarOpen
          sidebarOpen ? 'md:w-64' : 'md:w-20'
        )}
      >
        <div className="flex shrink-0 items-center justify-between p-5 sm:p-6">
          <div
            className={cn(
              'flex items-center gap-2.5',
              !sidebarOpen && 'md:hidden'
            )}
          >
            <img
              src="/logo.svg"
              alt="Noa Logo"
              className="h-8 w-8 rounded-lg shadow-2xs"
            />
            <div>
              <h1 className="font-serif text-2xl leading-none font-bold">
                Noa
              </h1>
              <p className="text-slate mt-0.5 text-xs">Clinical Copilot</p>
            </div>
          </div>

          {/* Desktop sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-deep-ink/10 hidden cursor-pointer rounded-full p-2 transition-colors md:block"
            aria-label="Toggle sidebar"
          >
            <Menu className="text-deep-ink h-5 w-5" />
          </button>

          {/* Mobile drawer close button */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="hover:bg-deep-ink/10 text-deep-ink cursor-pointer rounded-full p-2 transition-colors md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 font-sans">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isRestricted =
              item.requiresVerified &&
              doctor?.verificationStatus &&
              doctor.verificationStatus !== 'verified';
            const isActive =
              item.href === '/dashboard/doctor'
                ? pathname === '/dashboard/doctor'
                : pathname.startsWith(item.href);

            if (isRestricted) {
              return (
                <div
                  key={item.href}
                  className="text-slate/40 flex w-full cursor-not-allowed items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-medium sm:text-sm"
                  title="Licensure verification required"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-slate/30 h-4 w-4 shrink-0" />
                    <span
                      className={cn('truncate', !sidebarOpen && 'md:hidden')}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-slate/40 text-[10px] font-semibold tracking-wider uppercase',
                      !sidebarOpen && 'md:hidden'
                    )}
                  >
                    Locked
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-colors sm:text-sm',
                  isActive
                    ? 'text-deep-ink border-deep-ink/8 border bg-white font-semibold shadow-2xs'
                    : 'text-slate hover:text-deep-ink hover:bg-white/60'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-deep-ink' : 'text-slate'
                  )}
                />
                <span className={cn('truncate', !sidebarOpen && 'md:hidden')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-deep-ink/8 shrink-0 border-t p-3">
          <Link href="/auth/logout" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-2 rounded-lg text-xs font-medium"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className={cn(!sidebarOpen && 'md:hidden')}>Log Out</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <header className="border-deep-ink/10 sticky top-0 z-20 shrink-0 border-b bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex items-center gap-3">
              {/* Mobile menu hamburger button */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="hover:bg-soft-meadow text-deep-ink -ml-1 rounded-full p-2 transition-colors md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="truncate font-serif text-lg font-semibold sm:text-xl">
                Doctor Dashboard
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              {doctor?.verificationStatus &&
                doctor.verificationStatus !== 'verified' && (
                  <Link href="/dashboard/doctor/onboarding">
                    <span
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                        doctor.verificationStatus === 'pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          doctor.verificationStatus === 'pending'
                            ? 'animate-pulse bg-amber-500'
                            : 'bg-rose-500'
                        )}
                      />
                      <span>
                        {doctor.verificationStatus === 'pending'
                          ? 'Verification Pending'
                          : 'Action Required'}
                      </span>
                    </span>
                  </Link>
                )}
              <div className="bg-soft-meadow border-deep-ink/15 text-deep-ink flex h-9 w-9 items-center justify-center rounded-full border font-serif text-sm font-bold shadow-2xs sm:h-10 sm:w-10 sm:text-base">
                {doctorInitial}
              </div>
            </div>
          </div>
        </header>

        <div className="min-w-0 flex-1">
          {doctor &&
          doctor.verificationStatus &&
          doctor.verificationStatus !== 'verified' &&
          !isOnboardingRoute ? (
            <div className="text-slate flex min-h-[50vh] flex-col items-center justify-center gap-3 p-12 text-center text-sm">
              <ShieldCheck className="h-8 w-8 animate-pulse text-amber-600" />
              <p className="text-deep-ink font-semibold">
                Medical Licensure Review In Progress
              </p>
              <p className="text-slate max-w-md text-xs">
                Your medical credentials are currently under review. Redirecting
                to licensure onboarding...
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
