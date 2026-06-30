'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, LayoutDashboard, Mic, Settings, Users, Zap, Bell } from 'lucide-react'

import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const doctor = useDoctorDashboardStore(state => state.doctor)
  const doctorId = useDoctorDashboardStore(state => state.doctorId)
  const setDoctorId = useDoctorDashboardStore(state => state.setDoctorId)
  const loadDashboard = useDoctorDashboardStore(state => state.loadDashboard)

  useEffect(() => {
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
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-soft-meadow/40 border-r border-deep-ink/10 transition-all duration-300 ease-out flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between group">
          {sidebarOpen && (
            <Link href="/dashboard/doctor" className="flex items-center gap-3 flex-1">
              <Zap className="h-6 w-6 text-hi-yellow flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold font-serif truncate">Noa</h1>
                <p className="text-xs text-slate mt-0.5 truncate">{doctor?.name || 'Dashboard'}</p>
              </div>
            </Link>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-deep-ink/5 rounded-full transition-colors ml-auto flex-shrink-0"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <NavItem href="/dashboard/doctor" icon={<LayoutDashboard className="h-6 w-6" />} label="Dashboard" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/doctor/sessions/new" icon={<Mic className="h-6 w-6" />} label="Sessions" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/doctor/patients" icon={<Users className="h-6 w-6" />} label="Patients" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/doctor/summaries" icon={<FileText className="h-6 w-6" />} label="Summaries" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/doctor/settings" icon={<Settings className="h-6 w-6" />} label="Settings" sidebarOpen={sidebarOpen} />
        </nav>

        <div className="border-t border-deep-ink/10 p-4">
          <Link href="/auth/logout" className="w-full">
            <Button variant="outline" size="sm" className="w-full justify-center rounded-full border-deep-ink/20 hover:bg-canvas transition-colors">
              {sidebarOpen ? 'Log Out' : '←'}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-canvas">
        <header className="bg-white border-b border-deep-ink/5 sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold font-serif text-deep-ink">Doctor Dashboard</h2>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-soft-meadow rounded-full transition-colors duration-200" aria-label="Notifications">
                <Bell className="w-5 h-5 text-slate" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hi-yellow to-moss-green flex items-center justify-center font-semibold text-deep-ink shadow-md">
                {doctorInitial}
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}

function NavItem({ href, icon, label, sidebarOpen }: { href: string; icon: React.ReactNode; label: string; sidebarOpen: boolean }) {
  return (
    <Link href={href} className="block">
      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate hover:text-deep-ink hover:bg-canvas/60 transition-all duration-200 group">
        <span className="text-slate group-hover:text-hi-yellow flex-shrink-0 transition-colors duration-200">{icon}</span>
        {sidebarOpen && <span className="text-sm font-medium group-hover:text-deep-ink transition-colors duration-200">{label}</span>}
      </button>
    </Link>
  )
}
