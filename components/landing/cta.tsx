import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingCta() {
  return (
    <section className="bg-soft-meadow border-deep-ink/8 border-t py-20 sm:py-28">
      <div className="mx-auto max-w-2xl space-y-4 px-4 text-center sm:px-6">
        <h2 className="text-deep-ink font-serif text-2xl leading-snug font-medium tracking-tight sm:text-3xl">
          Ready to reclaim hours on clinical documentation?
        </h2>
        <p className="text-slate mx-auto max-w-lg text-sm leading-relaxed sm:text-base">
          Join healthcare professionals who have transformed consultation flow
          with Noa.
        </p>
        <div className="pt-3">
          <Link
            href="/auth/signup?type=doctor"
            className="inline-block w-full sm:w-auto"
          >
            <Button
              variant="dark"
              className="h-12 w-full rounded-lg px-8 py-3 text-sm font-semibold shadow-2xs sm:w-auto"
            >
              Start Your Practice Trial
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}