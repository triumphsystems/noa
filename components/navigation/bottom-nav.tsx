'use client'

import React from 'react'
import Link from 'next/link'
import {
  Home,
  CalendarDays,
  Stethoscope,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Mic,
  ClipboardList,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavTabItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number | null
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success'
  href?: string
  onClick?: () => void
}

export type UserRole = 'patient' | 'doctor' | 'admin' | 'custom'

export interface BottomNavProps {
  role?: UserRole
  activeTab: string
  onTabChange?: (tabId: string) => void
  badgeCounts?: Record<string, number | string | null | undefined>
  customTabs?: NavTabItem[]
  className?: string
  /**
   * If true, also shows on desktop inside a floating pill dock or stays docked.
   * Default: true
   */
  floatingDockOnDesktop?: boolean
}

export function BottomNav({
  role = 'patient',
  activeTab,
  onTabChange,
  badgeCounts = {},
  customTabs,
  className,
  floatingDockOnDesktop = true,
}: BottomNavProps) {
  // Define role-aware default tabs
  const getTabsForRole = (): NavTabItem[] => {
    if (customTabs && customTabs.length > 0) {
      return customTabs
    }

    switch (role) {
      case 'patient':
        return [
          {
            id: 'home',
            label: 'Overview',
            icon: Home,
          },
          {
            id: 'visits',
            label: 'Visits',
            icon: CalendarDays,
            badge: badgeCounts.visits,
          },
          {
            id: 'care-team',
            label: 'Care Team',
            icon: Stethoscope,
            badge: badgeCounts['care-team'] ?? badgeCounts.doctor,
            badgeVariant: 'warning',
          },
          {
            id: 'records',
            label: 'Health Data',
            icon: ShieldCheck,
            badge: badgeCounts.records,
          },
        ]

      case 'doctor':
        return [
          {
            id: 'overview',
            label: 'Schedule',
            icon: LayoutDashboard,
          },
          {
            id: 'patients',
            label: 'Patients',
            icon: Users,
            badge: badgeCounts.patients,
          },
          {
            id: 'new-session',
            label: 'New Visit',
            icon: Mic,
          },
          {
            id: 'summaries',
            label: 'SOAP Notes',
            icon: ClipboardList,
            badge: badgeCounts.summaries,
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
          },
        ]

      case 'admin':
        return [
          {
            id: 'pending',
            label: 'Pending',
            icon: Clock,
            badge: badgeCounts.pending,
            badgeVariant: 'warning',
          },
          {
            id: 'verified',
            label: 'Verified',
            icon: CheckCircle2,
            badge: badgeCounts.verified,
          },
          {
            id: 'rejected',
            label: 'Revoked',
            icon: XCircle,
            badge: badgeCounts.rejected,
            badgeVariant: 'danger',
          },
          {
            id: 'all',
            label: 'Directory',
            icon: Users,
            badge: badgeCounts.all ?? badgeCounts.total,
          },
        ]

      default:
        return []
    }
  }

  const tabs = getTabsForRole()

  if (tabs.length === 0) return null

  return (
    <nav
      aria-label={`${role} bottom navigation`}
      role="tablist"
      className={cn(
        // Base fixed positioning at bottom of viewport
        'fixed bottom-0 left-0 right-0 z-40 select-none pointer-events-none transition-all',
        // Desktop handling: centered dock or standard bar
        floatingDockOnDesktop ? 'sm:bottom-4 sm:flex sm:justify-center' : '',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-auto w-full transition-all flex items-center justify-around',
          // Mobile dock: full width edge-to-edge with safe area padding
          'bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_25px_rgba(19,14,48,0.08)] px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]',
          // Desktop pill floating dock
          floatingDockOnDesktop &&
            'sm:max-w-md sm:rounded-2xl sm:border sm:border-slate-200/80 sm:shadow-lg sm:p-1.5 sm:bg-white/90 sm:backdrop-blur-2xl'
        )}
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const badgeValue = tab.badge

          const content = (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => {
                tab.onClick?.()
                onTabChange?.(tab.id)
              }}
              className={cn(
                'relative flex-1 py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[50px] outline-none select-none active:scale-95',
                isActive
                  ? 'text-deep-ink font-semibold'
                  : 'text-slate/75 hover:text-deep-ink font-medium'
              )}
            >
              {/* Active Background Pill Indicator */}
              {isActive && (
                <span
                  className={cn(
                    'absolute inset-1 rounded-xl transition-all',
                    role === 'patient'
                      ? 'bg-hi-yellow/25 ring-1 ring-hi-yellow/60'
                      : role === 'admin'
                      ? 'bg-teal-50 ring-1 ring-teal-600/30'
                      : 'bg-soft-meadow ring-1 ring-deep-ink/10'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive ? 'scale-110 text-deep-ink' : 'text-slate/80'
                  )}
                />

                {/* Badge Indicator */}
                {badgeValue !== undefined && badgeValue !== null && badgeValue !== '' && badgeValue !== 0 && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-2xs border border-white',
                      tab.badgeVariant === 'danger'
                        ? 'bg-rose-500 text-white'
                        : tab.badgeVariant === 'warning'
                        ? 'bg-amber-400 text-deep-ink'
                        : tab.badgeVariant === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-deep-ink text-canvas'
                    )}
                  >
                    {typeof badgeValue === 'number' && badgeValue > 99 ? '99+' : badgeValue}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'relative z-10 text-[11px] tracking-tight truncate max-w-[72px] transition-colors',
                  isActive ? 'text-deep-ink font-bold' : 'text-slate/80'
                )}
              >
                {tab.label}
              </span>

              {/* Native Dot Indicator below label for active tab */}
              {isActive && (
                <span
                  className={cn(
                    'w-1 h-1 rounded-full absolute bottom-1',
                    role === 'patient'
                      ? 'bg-deep-ink'
                      : role === 'admin'
                      ? 'bg-teal-700'
                      : 'bg-deep-ink'
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          )

          if (tab.href) {
            return (
              <Link key={tab.id} href={tab.href} className="flex-1">
                {content}
              </Link>
            )
          }

          return content
        })}
      </div>
    </nav>
  )
}
