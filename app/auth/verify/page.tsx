import Link from 'next/link';
import { Button } from '@/components/ui/button';

type VerifyPageProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const resolvedSearchParams = await searchParams;
  const email = resolvedSearchParams?.email?.trim() || '';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-hi-yellow mb-3 text-xs font-semibold tracking-[0.3em] uppercase">
          Account created
        </p>
        <h2 className="mb-2 font-serif text-2xl font-bold">Check your email</h2>
        <p className="text-slate text-sm leading-6">
          We sent a verification message{email ? ` to ${email}` : ''}. Follow
          the link in that email to finish setting up your account.
        </p>
      </div>

      <div className="border-deep-ink/10 bg-soft-meadow/40 text-deep-ink space-y-2 rounded-2xl border p-4 text-sm">
        <p className="font-medium">If you do not see it:</p>
        <ul className="text-slate list-disc space-y-1 pl-5">
          <li>Check your spam or promotions folder.</li>
          <li>Wait a minute and refresh your inbox.</li>
          <li>Use the same email you entered during signup.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Link href="/auth/login" className="block">
          <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full rounded-full py-2 font-medium">
            Go to sign in
          </Button>
        </Link>

        <Link href="/auth/signup" className="block">
          <Button
            variant="outline"
            className="border-deep-ink/20 text-deep-ink hover:bg-deep-ink/5 w-full rounded-full py-2 font-medium"
          >
            Create another account
          </Button>
        </Link>
      </div>
    </div>
  );
}
