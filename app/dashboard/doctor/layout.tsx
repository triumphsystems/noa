'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, FileText, LayoutDashboard, LogOut, Menu, Mic, Settings, ShieldCheck, Users, X } from 'lucide-react'

import { useDoctorStore } from '@/lib/stores/doctor.store'
import { cn } from '@/lib/utils'

interface NavItemConfig {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  requiresVerified?: boolean
}

const NAV_ITEMS: NavItemConfig[] = [
  { href: '/dashboard/doctor', icon: LayoutDashboard, label: 'Dashboard', requiresVerified: true },
  { href: '/dashboard/doctor/sessions/new', icon: Mic, label: 'Sessions', requiresVerified: true },
  { href: '/dashboard/doctor/patients', icon: Users, label: 'Patients', requiresVerified: true },
  { href: '/dashboard/doctor/summaries', icon: FileText, label: 'Summaries', requiresVerified: true },
  { href: '/dashboard/doctor/onboarding', icon: ShieldCheck, label: 'Licensure', requiresVerified: false },
  { href: '/dashboard/doctor/settings', icon: Settings, label: 'Settings', requiresVerified: false },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const doctor = useDoctorStore(state => state.doctor)
  const doctorId = useDoctorStore(state => state.doctorId)
  const setDoctorId = useDoctorStore(state => state.setDoctorId)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

  const isVerified = doctor?.verificationStatus === 'verified'
  const isOnboardingRoute = pathname === '/dashboard/doctor/onboarding'

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedDoctorId = window.localStorage.getItem('doctorId')

    if (storedDoctorId && storedDoctorId !== doctorId) {
      setDoctorId(storedDoctorId)
      void loadDashboard(storedDoctorId)
      return
    }

    if (storedDoctorId && !doctor && doctorId === storedDoctorId) {
      void loadDashboard(storedDoctorId)
    }
  }, [doctor, doctorId, loadDashboard, setDoctorId])

  // Enforce doctor credential review lockout:
  // If doctor's medical license is under review or rejected, keep redirecting to onboarding
  useEffect(() => {
    if (doctor && doctor.verificationStatus && doctor.verificationStatus !== 'verified') {
      if (!isOnboardingRoute) {
        router.replace('/dashboard/doctor/onboarding')
      }
    }
  }, [doctor, isOnboardingRoute, router])

  const doctorInitial = useMemo(() => {
    const source = doctor?.name?.trim() || 'Doctor'
    return source.charAt(0).toUpperCase()
  }, [doctor?.name])

  return (
    <div className="min-h-screen md:h-dvh md:overflow-hidden bg-canvas text-deep-ink flex flex-col md:flex-row">
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-deep-ink/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Responsive Drawer on Mobile, Fixed/Sticky on Desktop) */}
      <aside
        className={cn(
          'bg-soft-meadow border-r border-deep-ink/10 transition-all duration-300 flex flex-col',
          // Mobile: fixed off-canvas drawer
          'fixed inset-y-0 left-0 z-50 w-72 md:sticky md:top-0 md:h-full md:self-start md:shrink-0 md:z-30 shadow-xl md:shadow-none',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Desktop: responsive width based on sidebarOpen
          sidebarOpen ? 'md:w-64' : 'md:w-20'
        )}
      >
        <div className="p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className={cn('flex items-center gap-2.5', !sidebarOpen && 'md:hidden')}>
            <img src="/logo.svg" alt="Noa Logo" className="w-8 h-8 rounded-lg shadow-2xs" />
            <div>
              <h1 className="text-2xl font-bold font-serif leading-none">Noa</h1>
              <p className="text-xs text-slate mt-0.5">Clinical Copilot</p>
            </div>
          </div>

          {/* Desktop sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-deep-ink/10 rounded-full transition-colors hidden md:block cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-deep-ink" />
          </button>

          {/* Mobile drawer close button */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-2 hover:bg-deep-ink/10 rounded-full transition-colors md:hidden text-deep-ink cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain font-sans">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isRestricted = item.requiresVerified && doctor?.verificationStatus && doctor.verificationStatus !== 'verified'
            const isActive =
              item.href === '/dashboard/doctor'
                ? pathname === '/dashboard/doctor'
                : pathname.startsWith(item.href)

            if (isRestricted) {
              return (
                <div
                  key={item.href}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate/40 cursor-not-allowed text-xs sm:text-sm font-medium"
                  title="Licensure verification required"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-slate/30" />
                    <span className={cn('truncate', !sidebarOpen && 'md:hidden')}>{item.label}</span>
                  </div>
                  <span className={cn('text-[10px] uppercase font-semibold tracking-wider text-slate/40', !sidebarOpen && 'md:hidden')}>
                    Locked
                  </span>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-xs sm:text-sm font-medium',
                  isActive
                    ? 'bg-white text-deep-ink shadow-2xs border border-deep-ink/8 font-semibold'
                    : 'text-slate hover:bg-white/60 hover:text-deep-ink'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-deep-ink' : 'text-slate')} />
                <span className={cn('truncate', !sidebarOpen && 'md:hidden')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-deep-ink/8 p-3 shrink-0">
          <Link href="/auth/logout" className="block">
            <Button variant="outline" size="sm" className="w-full justify-center rounded-lg gap-2 text-xs font-medium">
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className={cn(!sidebarOpen && 'md:hidden')}>Log Out</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col min-w-0">
        <header className="bg-white border-b border-deep-ink/10 sticky top-0 z-20 shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile menu hamburger button */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="p-2 -ml-1 hover:bg-soft-meadow rounded-full text-deep-ink transition-colors md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold font-serif truncate">Doctor Dashboard</h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {doctor?.verificationStatus && doctor.verificationStatus !== 'verified' && (
                <Link href="/dashboard/doctor/onboarding">
                  <span
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer',
                      doctor.verificationStatus === 'pending'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        doctor.verificationStatus === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                      )}
                    />
                    <span>
                      {doctor.verificationStatus === 'pending' ? 'Verification Pending' : 'Action Required'}
                    </span>
                  </span>
                </Link>
              )}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-soft-meadow border border-deep-ink/15 flex items-center justify-center font-serif font-bold text-deep-ink shadow-2xs text-sm sm:text-base">
                {doctorInitial}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-w-0">
          {doctor && doctor.verificationStatus && doctor.verificationStatus !== 'verified' && !isOnboardingRoute ? (
            <div className="p-12 text-center text-slate text-sm flex flex-col items-center justify-center min-h-[50vh] gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-600 animate-pulse" />
              <p className="font-semibold text-deep-ink">Medical Licensure Review In Progress</p>
              <p className="text-xs text-slate max-w-md">
                Your medical credentials are currently under review. Redirecting to licensure onboarding...
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  )
}
