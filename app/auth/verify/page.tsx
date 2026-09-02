import Link from 'next/link'
import { Button } from '@/components/ui/button'

type VerifyPageProps = {
  searchParams?: Promise<{
    email?: string
  }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const resolvedSearchParams = await searchParams
  const email = resolvedSearchParams?.email?.trim() || ''

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-hi-yellow font-semibold mb-3">
          Account created
        </p>
        <h2 className="text-2xl font-bold font-serif mb-2">Check your email</h2>
        <p className="text-slate text-sm leading-6">
          We sent a verification message{email ? ` to ${email}` : ''}. Follow the link in that email to finish setting up your account.
        </p>
      </div>

      <div className="rounded-2xl border border-deep-ink/10 bg-soft-meadow/40 p-4 text-sm text-deep-ink space-y-2">
        <p className="font-medium">If you do not see it:</p>
        <ul className="space-y-1 text-slate list-disc pl-5">
          <li>Check your spam or promotions folder.</li>
          <li>Wait a minute and refresh your inbox.</li>
          <li>Use the same email you entered during signup.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link href="/auth/login" className="block">
          <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium py-2">
            Go to sign in
          </Button>
        </Link>

        <Link href="/auth/signup" className="block">
          <Button variant="outline" className="w-full rounded-full border-deep-ink/20 text-deep-ink hover:bg-deep-ink/5 font-medium py-2">
            Create another account
          </Button>
        </Link>
      </div>
    </div>
  )
}