'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-soft-meadow border-r border-deep-ink/20 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-2xl font-bold font-serif">Noa</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-deep-ink/10 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2">
          <NavItem href="/dashboard" icon="📊" label="Dashboard" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/sessions" icon="🎤" label="Sessions" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/patients" icon="👥" label="Patients" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/summaries" icon="📄" label="Summaries" sidebarOpen={sidebarOpen} />
          <NavItem href="/dashboard/settings" icon="⚙️" label="Settings" sidebarOpen={sidebarOpen} />
        </nav>

        <div className="border-t border-deep-ink/20 p-4">
          <Link href="/auth/logout">
            <Button variant="outline" size="sm" className="w-full justify-center rounded-full">
              {sidebarOpen ? 'Log Out' : 'Out'}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-deep-ink/20 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold font-serif">Doctor Dashboard</h2>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-soft-meadow rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-hi-yellow flex items-center justify-center font-semibold text-deep-ink">
                D
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}

function NavItem({ href, icon, label, sidebarOpen }: { href: string; icon: string; label: string; sidebarOpen: boolean }) {
  return (
    <Link href={href}>
      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full hover:bg-deep-ink/10 transition-colors">
        <span className="text-xl">{icon}</span>
        {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
      </button>
    </Link>
  )
}
