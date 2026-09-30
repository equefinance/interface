import { StickyHero } from "@/components/sticky-hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Vaults } from "@/components/sections/vaults";
import { Faq } from "@/components/sections/faq";
import { CtaSwitch } from "@/components/cta-switch";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-[#070A0F] text-[#E4EAF0]">
      <StickyHero />
      <HowItWorks />
      <Vaults />
      <Faq />
      <CtaSwitch />
    </main>
  );
}
