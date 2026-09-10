'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, LogOut, Menu, UserCheck, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDashboardPath } from '@/lib/auth/roles';

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const dashboardHref = getDashboardPath(user?.userType);
  const roleLabel = user?.userType
    ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1)
    : '';

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';

  return (
    <nav className="border-deep-ink/8 bg-canvas/90 sticky top-0 z-30 border-b font-sans backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-3.5">
          <img
            src="/logo.svg"
            alt="Noa Logo"
            className="border-deep-ink/15 h-10 w-10 shrink-0 rounded-xl border shadow-2xs transition-transform group-hover:scale-105"
          />
          <span className="text-deep-ink font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Noa
          </span>
          <Badge
            variant="secondary"
            className="hidden font-sans text-xs sm:inline-flex"
          >
            Clinical Intelligence
          </Badge>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="#features"
            className="text-slate hover:text-deep-ink text-sm font-medium transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-slate hover:text-deep-ink text-sm font-medium transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/intake"
            className="text-deep-ink hover:text-deep-ink/80 bg-soft-meadow border-deep-ink/10 hover:bg-soft-meadow/70 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold transition-colors"
          >
            <UserCheck className="text-deep-ink h-3.5 w-3.5" />
            <span>Patient Check-in</span>
          </Link>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-2">
              <Link
                href={dashboardHref}
                className="hover:border-deep-ink/20 flex items-center gap-2 rounded-xl border border-transparent p-1 transition-all"
              >
                <div className="border-deep-ink/15 bg-soft-meadow flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border shadow-2xs">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-deep-ink font-serif text-xs font-bold">
                      {userInitial}
                    </span>
                  )}
                </div>
                <div className="hidden flex-col text-left xl:flex">
                  <span className="text-deep-ink max-w-[120px] truncate text-xs font-semibold">
                    {user.name || user.email}
                  </span>
                  <span className="text-slate text-[10px] capitalize">
                    {roleLabel}
                  </span>
                </div>
              </Link>
              <Link href={dashboardHref}>
                <Button
                  variant="dark"
                  size="sm"
                  className="bg-deep-ink hover:bg-deep-ink/90 gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-white shadow-xs"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate hover:text-deep-ink hover:bg-deep-ink/5 h-8 px-2 text-xs"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 pl-2">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-deep-ink/80 hover:text-deep-ink hover:bg-deep-ink/5 h-9 rounded-lg px-3.5 text-xs font-semibold"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  variant="dark"
                  size="sm"
                  className="bg-deep-ink hover:bg-deep-ink/90 h-9 rounded-lg px-4 text-xs font-semibold text-white shadow-xs transition-all hover:shadow"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Toggle & Quick Actions */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && user ? (
            <Link href={dashboardHref}>
              <div className="border-deep-ink/15 bg-soft-meadow flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border shadow-2xs">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-deep-ink font-serif text-xs font-bold">
                    {userInitial}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="xs"
                className="h-7 rounded-lg px-2.5 text-xs"
              >
                Log In
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-deep-ink"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-deep-ink/8 bg-canvas space-y-3 border-t px-4 py-4 md:hidden">
          <div className="flex flex-col space-y-1">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-deep-ink hover:bg-soft-meadow rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-deep-ink hover:bg-soft-meadow rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/intake"
              onClick={() => setMobileMenuOpen(false)}
              className="text-deep-ink bg-soft-meadow border-deep-ink/10 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
            >
              <UserCheck className="text-deep-ink h-4 w-4" />
              <span>Patient Check-in</span>
            </Link>
          </div>
          <div className="border-deep-ink/8 flex flex-col gap-2 border-t pt-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="dark"
                    className="w-full gap-2 rounded-lg font-medium"
                  >
                    <span>Go to Dashboard ({roleLabel})</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full gap-2 rounded-lg text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </Button>
              </>
            ) : (
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="dark"
                  className="w-full rounded-lg font-medium"
                >
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
