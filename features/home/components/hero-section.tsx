import { Button } from "@/components/ui/button";
import { HERO_ICONS, HOME_CONTENT } from "@/features/home/constants/home-content";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroIllustration } from "./hero-illustration";
import { HowItWorksCard } from "./how-it-works-card";

export function HeroSection() {
  const { hero } = HOME_CONTENT;
  const EyebrowIcon = HERO_ICONS.eyebrow;

  return (
    <section aria-labelledby="home-hero-heading" className="px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      <div className="container mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.78fr)_minmax(0,0.9fr)] lg:gap-8">
        <div className="max-w-xl">
          <div className="border-border bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
            <EyebrowIcon className="text-primary size-4" aria-hidden="true" />
            {hero.eyebrow}
          </div>

          <h1 id="home-hero-heading" className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
            {hero.title[0]} <span className="text-primary">{hero.title[1]}</span>
          </h1>

          <p className="text-muted-foreground mt-5 max-w-lg text-base leading-7 sm:text-lg">
            {hero.description}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/books/new">
                {hero.primaryAction}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#library">{hero.secondaryAction}</Link>
            </Button>
          </div>
        </div>

        <HeroIllustration {...hero.illustration} />
        <HowItWorksCard />
      </div>
    </section>
  );
}
