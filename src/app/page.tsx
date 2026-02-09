
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { InteractiveBackground } from '@/components/landing/InteractiveBackground';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden">
      <InteractiveBackground />
      <HeroSection />
      <FeaturesGrid />
    </main>
  );
}

