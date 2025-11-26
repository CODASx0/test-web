"use client";

import { HeroSection } from "./components/ui/hero-section";
import { TitleAnimationSection } from "./components/ui/title-animation-section";
import { HeroAnimationCanvas } from "./components/ui/hero-animation-canvas";

export default function Home() {
  return (
    <main className="w-full">
      <section className="relative h-screen w-full bg-[#f8f6f2] border-t border-black/5">
        <HeroAnimationCanvas
          title={"Design for Love"}
        />
      </section>

      <HeroSection />
      <TitleAnimationSection />

      {/* Section 3: Canvas 动画（解决可变字体像素跳动问题） */}
      
    </main>
  );
}
