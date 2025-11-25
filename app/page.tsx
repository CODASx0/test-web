"use client";

import { HeroSection } from "./components/ui/hero-section";
import { TitleAnimationSection } from "./components/ui/title-animation-section";

export default function Home() {
  return (
    <main className="w-full">
      <HeroSection />
      <TitleAnimationSection />

      {/* <section className="relative h-screen w-full bg-[#050505]">
        <div className="flex h-full w-full items-center justify-center text-zinc-400">
          <span>Animation Area</span>
        </div>
        <div className="absolute top-0 left-0 z-10 p-4">
          <h2 className="text-xl font-[550] font-nohemi">Section 3 (Nothing yet)</h2>
        </div>
      </section> */}
      
      </main>
  );
}
