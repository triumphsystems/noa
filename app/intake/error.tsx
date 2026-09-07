'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function IntakeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for clinical debugging
    console.error('[Intake] Runtime Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen flex-col items-center justify-center p-4">
      <div className="border-deep-ink/10 w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="text-deep-ink font-serif text-xl font-bold tracking-tight sm:text-2xl">
            Unable to load intake
          </h1>

          <p className="text-slate mt-2 text-sm">
            {error?.message ||
              'A temporary issue occurred while initializing the intake session. Please try again or return home.'}
          </p>

          {error?.digest && (
            <span className="text-slate/60 mt-2 font-mono text-[11px]">
              Error code: {error.digest}
            </span>
          )}

          <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-moss-green hover:bg-moss-green/90 inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Intake</span>
            </button>

            <Link
              href="/"
              className="border-deep-ink/15 text-deep-ink hover:bg-soft-meadow inline-flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-2xs transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
