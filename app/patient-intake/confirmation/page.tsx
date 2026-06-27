'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-moss-green/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-moss-green" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold font-serif mb-3">Intake Form Submitted</h1>
        <p className="text-slate mb-8">
          Thank you for completing your patient intake form. Your information has been securely stored and will be
          reviewed by our medical team shortly.
        </p>

        <div className="bg-soft-meadow rounded-3xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-deep-ink mb-4">What Happens Next?</h3>
          <ol className="space-y-3 text-sm text-slate">
            <li className="flex gap-3">
              <span className="text-hi-yellow font-bold">1</span>
              <span>Your information will be reviewed by our clinical team within 24 hours</span>
            </li>
            <li className="flex gap-3">
              <span className="text-hi-yellow font-bold">2</span>
              <span>You will receive an email with appointment scheduling instructions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-hi-yellow font-bold">3</span>
              <span>Schedule your first consultation at a time that works for you</span>
            </li>
            <li className="flex gap-3">
              <span className="text-hi-yellow font-bold">4</span>
              <span>Access your patient portal to communicate with your healthcare provider</span>
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <Link href="/patient-dashboard" className="block">
            <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              Go to Patient Portal
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow">
              Return to Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate mt-8">
          If you have any questions, contact us at{' '}
          <a href="mailto:support@noa.health" className="text-hi-yellow hover:underline">
            support@noa.health
          </a>
        </p>
      </div>
    </div>
  )
}
