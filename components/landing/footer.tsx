import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-deep-ink py-12 text-white/70 sm:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-xs sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-base font-medium text-white">
              Noa
            </span>
            <span className="text-white/50">— Medical Memory Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-white/60">
          <Link href="#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-white"
          >
            How It Works
          </Link>
          <Link href="/intake" className="transition-colors hover:text-white">
            Patient Check-in
          </Link>
          <Link href="/auth/login" className="transition-colors hover:text-white">
            Portal Login
          </Link>
        </div>
        <p className="text-white/40">
          &copy; {new Date().getFullYear()} Noa Health. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
