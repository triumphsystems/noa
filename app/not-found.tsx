import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-md w-full p-6 sm:p-8 text-center space-y-6 shadow-md border-deep-ink/10">
        <div className="space-y-2">
          <p className="text-5xl font-serif font-bold text-deep-ink tracking-tight">404</p>
          <h1 className="text-2xl font-bold font-serif text-deep-ink">Page Not Found</h1>
          <p className="text-slate text-sm leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href="/dashboard/doctor" className="block">
            <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 py-5 font-semibold gap-2">
              <Home className="w-4 h-4" />
              <span>Go to Doctor Dashboard</span>
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow py-5 font-medium gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
