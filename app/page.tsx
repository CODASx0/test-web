"use client";

import { HeroSection } from "./components/ui/hero-section";
import { TitleAnimationSection } from "./components/ui/title-animation-section";
import { FeaturesSection } from "./components/ui/features-section";


export default function Home() {
  return (
    <main className="w-full">
      

      <HeroSection />
      <FeaturesSection />
      <TitleAnimationSection />
      

      {/* Section 3: Canvas 动画（解决可变字体像素跳动问题） */}
      
    </main>
  );
}
