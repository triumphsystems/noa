'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, FileText, LayoutDashboard, LogOut, Menu, Mic, Settings, Users } from 'lucide-react'

import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'
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
  const doctor = useDoctorDashboardStore(state => state.doctor)
  const doctorId = useDoctorDashboardStore(state => state.doctorId)
  const setDoctorId = useDoctorDashboardStore(state => state.setDoctorId)
  const loadDashboard = useDoctorDashboardStore(state => state.loadDashboard)

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
    <div className="min-h-screen bg-canvas text-deep-ink flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-soft-meadow border-r border-deep-ink/10 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-2xl font-bold font-serif">Noa</h1>
              <p className="text-xs text-slate mt-1">{doctor?.name || 'Doctor dashboard'}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-deep-ink/10 rounded-full transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-deep-ink" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
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
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-hi-yellow text-deep-ink shadow-xs'
                    : 'text-deep-ink/80 hover:bg-deep-ink/5 hover:text-deep-ink'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-deep-ink' : 'text-deep-ink/70')} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-deep-ink/10 p-4">
          <Link href="/auth/logout" className="block">
            <Button variant="outline" size="sm" className="w-full justify-center rounded-full gap-2">
              <LogOut className="h-4 w-4" />
              {sidebarOpen && <span>Log Out</span>}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-deep-ink/10 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold font-serif">Doctor Dashboard</h2>
            <div className="flex items-center gap-4">
              <button
                className="p-2 hover:bg-soft-meadow rounded-full text-deep-ink transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-hi-yellow border border-deep-ink/10 flex items-center justify-center font-serif font-bold text-deep-ink shadow-xs">
                {doctorInitial}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
