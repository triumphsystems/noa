import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeBannerProps {
  name: string;
  hasDoctor: boolean;
  doctorName?: string;
}

export function WelcomeBanner({
  name,
  hasDoctor,
  doctorName,
}: WelcomeBannerProps) {
  return (
    <Card className="from-soft-meadow to-soft-meadow/40 bg-gradient-to-r via-white p-5 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-deep-ink mb-2 font-serif text-2xl font-bold sm:text-3xl">
            Welcome back, {name || 'Patient'}
          </h2>
          <p className="text-slate max-w-3xl text-xs sm:text-sm">
            {hasDoctor && doctorName
              ? `Your care team is led by ${doctorName}. Review consultation summaries, care plans, and health records.`
              : 'Access your consultation summaries, review your care plans, and keep track of your prescribed medications.'}
          </p>
        </div>
        <Link href="/intake" className="block sm:inline">
          <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full shrink-0 rounded-full text-xs font-medium sm:w-auto sm:text-sm">
            Update Health Intake
          </Button>
        </Link>
      </div>
    </Card>
  );
}
