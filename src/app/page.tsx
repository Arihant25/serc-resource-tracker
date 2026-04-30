
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { InteractiveBackground } from '@/components/landing/InteractiveBackground';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden">
      <InteractiveBackground />
      <HeroSection />
      <FeaturesGrid />
    </main>
  );
}

