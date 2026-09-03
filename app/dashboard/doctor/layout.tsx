'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, FileText, LayoutDashboard, LogOut, Menu, Mic, Settings, Users, X } from 'lucide-react'

import { useDoctorStore } from '@/lib/stores/doctor.store'
import { cn } from '@/lib/utils'

interface NavItemConfig {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const NAV_ITEMS: NavItemConfig[] = [
  { href: '/dashboard/doctor', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/doctor/sessions/new', icon: Mic, label: 'Sessions' },
  { href: '/dashboard/doctor/patients', icon: Users, label: 'Patients' },
  { href: '/dashboard/doctor/summaries', icon: FileText, label: 'Summaries' },
  { href: '/dashboard/doctor/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const doctor = useDoctorStore(state => state.doctor)
  const doctorId = useDoctorStore(state => state.doctorId)
  const setDoctorId = useDoctorStore(state => state.setDoctorId)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

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

  const doctorInitial = useMemo(() => {
    const source = doctor?.name?.trim() || 'Doctor'
    return source.charAt(0).toUpperCase()
  }, [doctor?.name])

  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex flex-col md:flex-row">
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-deep-ink/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Responsive Drawer on Mobile, Collapsible on Desktop) */}
      <aside
        className={cn(
          'bg-soft-meadow border-r border-deep-ink/10 transition-all duration-300 flex flex-col',
          // Mobile: fixed off-canvas drawer
          'fixed inset-y-0 left-0 z-50 w-72 md:static shadow-xl md:shadow-none',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Desktop: responsive width based on sidebarOpen
          sidebarOpen ? 'md:w-64' : 'md:w-20'
        )}
      >
        <div className="p-5 sm:p-6 flex items-center justify-between">
          <div className={cn('flex items-center gap-2', !sidebarOpen && 'md:hidden')}>
            <div>
              <h1 className="text-2xl font-bold font-serif">Noa</h1>
              <p className="text-xs text-slate mt-0.5 truncate max-w-[160px]">{doctor?.name || 'Doctor dashboard'}</p>
            </div>
          </div>

          {/* Desktop sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-deep-ink/10 rounded-full transition-colors hidden md:block"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-deep-ink" />
          </button>

          {/* Mobile drawer close button */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-2 hover:bg-deep-ink/10 rounded-full transition-colors md:hidden text-deep-ink"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard/doctor'
                ? pathname === '/dashboard/doctor'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-hi-yellow text-deep-ink shadow-xs'
                    : 'text-deep-ink/80 hover:bg-deep-ink/5 hover:text-deep-ink'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-deep-ink' : 'text-deep-ink/70')} />
                <span className={cn('truncate', !sidebarOpen && 'md:hidden')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-deep-ink/10 p-4">
          <Link href="/auth/logout" className="block">
            <Button variant="outline" size="sm" className="w-full justify-center rounded-full gap-2">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={cn(!sidebarOpen && 'md:hidden')}>Log Out</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col min-w-0">
        <header className="bg-white border-b border-deep-ink/10 sticky top-0 z-20">
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
              <button
                className="p-2 hover:bg-soft-meadow rounded-full text-deep-ink transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-hi-yellow border border-deep-ink/10 flex items-center justify-center font-serif font-bold text-deep-ink shadow-xs text-sm sm:text-base">
                {doctorInitial}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </main>
    </div>
  )
}
