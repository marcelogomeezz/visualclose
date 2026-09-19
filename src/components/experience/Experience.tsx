"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { Nav } from "./Nav";
import { AboutSection, CategoriesSection, FooterCta, Hero, HowItWorks, OutputsSection, RealPlanSection, StorySection } from "./sections";

/** The public VisualClose Experience: cinematic, scroll-controlled, photography first. */
export function Experience() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);
  return (
    <div className="bg-stone text-ink">
      <Nav />
      <Hero />
      <StorySection />
      <CategoriesSection />
      <RealPlanSection />
      <HowItWorks />
      <OutputsSection />
      <AboutSection />
      <FooterCta />
    </div>
  );
}
