import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Card className="border-deep-ink/10 w-full max-w-md space-y-6 p-6 text-center shadow-md sm:p-8">
        <div className="space-y-2">
          <p className="text-deep-ink font-serif text-5xl font-bold tracking-tight">
            404
          </p>
          <h1 className="text-deep-ink font-serif text-2xl font-bold">
            Page Not Found
          </h1>
          <p className="text-slate text-sm leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href="/dashboard/doctor" className="block">
            <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full gap-2 rounded-full py-5 font-semibold">
              <Home className="h-4 w-4" />
              <span>Go to Doctor Dashboard</span>
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full gap-2 rounded-full py-5 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Home</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
