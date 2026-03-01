import { LandingNav } from "@/components/landing-nav"
import { LandingHero } from "@/components/landing-hero"
import { LandingWhy } from "@/components/landing-why"
import { LandingProblem } from "@/components/landing-problem"
import { LandingHowItWorks } from "@/components/landing-how-it-works"
import { LandingUseCases } from "@/components/landing-use-cases"
import { LandingTechnical } from "@/components/landing-technical"
import { LandingQuickstart } from "@/components/landing-quickstart"
import { LandingFAQ } from "@/components/landing-faq"
import { LandingFooter } from "@/components/landing-footer"

export default function Page() {
  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingWhy />
        <LandingProblem />
        <LandingHowItWorks />
        <LandingUseCases />
        <LandingTechnical />
        <LandingQuickstart />
        <LandingFAQ />
      </main>
      <LandingFooter />
    </div>
  )
}