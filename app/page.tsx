import {
  LandingNav,
  LandingHero,
  LandingFeatures,
  LandingWorkflow,
  LandingCta,
  LandingFooter,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="bg-canvas text-deep-ink min-h-screen">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingWorkflow />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
