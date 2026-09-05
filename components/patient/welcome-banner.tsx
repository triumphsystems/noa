import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WelcomeBannerProps {
  name: string
  hasDoctor: boolean
  doctorName?: string
}

export function WelcomeBanner({ name, hasDoctor, doctorName }: WelcomeBannerProps) {
  return (
    <Card className="p-5 sm:p-8 bg-gradient-to-r from-soft-meadow via-white to-soft-meadow/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-2 text-deep-ink">
            Welcome back, {name || 'Patient'}
          </h2>
          <p className="text-slate text-xs sm:text-sm max-w-3xl">
            {hasDoctor && doctorName
              ? `Your care team is led by ${doctorName}. Review consultation summaries, care plans, and health records.`
              : 'Access your consultation summaries, review your care plans, and keep track of your prescribed medications.'}
          </p>
        </div>
        <Link href="/intake" className="block sm:inline">
          <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium shrink-0 text-xs sm:text-sm">
            Update Health Intake
          </Button>
        </Link>
      </div>
    </Card>
  )
}
