"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { HeroAnimationA } from "./hero-animation-a";
import { HeroAnimationB } from "./hero-animation-b";

export function HeroSection() {
  const [animationMode, setAnimationMode] = useState<"A" | "B">("A");
  const [key, setKey] = useState(0);

  const HERO_TITLE = "Chat your way\nto great videos";
  const HERO_SUBTITLE = "Whatever you type, it just works.";

  const handleReload = (mode: "A" | "B") => {
    setAnimationMode(mode);
    setKey((prev) => prev + 1);
  };

  return (
    <section className="relative h-screen w-full bg-[#f4f4f5] border-b border-white/60">
      <div className="flex flex-col h-full w-full items-center justify-center text-slate-700 gap-[64px] p-10">
        {animationMode === "A" ? (
          <HeroAnimationA
            key={`hero-animation-a-${key}`}
            title={HERO_TITLE}
            subtitle={HERO_SUBTITLE}
            animationKey={`${key}-${animationMode}`}
            typewriterOptions={{
              wordPause: {
                Chat: 300,
                way: 500,
                to: 330,
              },
            }}
          />
        ) : (
          <HeroAnimationB
            key={`hero-animation-b-${key}`}
            title={HERO_TITLE}
            subtitle={HERO_SUBTITLE}
            animationKey={`${key}-${animationMode}`}
          />
        )}

        {/* 这一部分没有做宽度自适应，用绝对值来的，需要优化 */}

        <div className="relative mt-6 flex justify-center">
          <motion.div
            key={`hero-panel-${animationMode}-${key}`}
            initial={{
              opacity: 0,
              filter: "blur(30px)",
              width: "756px",
              
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              height: "165px",
              width: "956px",
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: animationMode === "A" ? 0.6 : 0.4,
              width: {
                type: "spring",
                stiffness: 40,
                damping: 30,
                delay: animationMode === "A" ? 0.6 : 0.4,
              },
              height: {
                type: "spring",
                stiffness: 40,
                damping: 30,
                delay: animationMode === "A" ? 0.6 : 0.4,
              },
            }}
            className="relative z-10 h-[165px] rounded-[32px] bg-white/90"
          />

          <motion.div
            key={`hero-panel-layer-${animationMode}-${key}`}
            initial={{
              filter: "blur(100px)",
              opacity: 0,
              width: "556px",
              
            }}
            animate={{
              filter: "blur(40px)",
              opacity: 1,
              width: "836px",
              
              transform: "translateY(30px)",
            }}
            transition={{
              type: "spring",
                stiffness: 40,
                damping: 20,
              delay: 1.6,
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          >
            <div className="h-[105px] w-full rounded-[36px] overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              >
                <source src="/layer.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute top-0 left-0 z-10 flex items-center gap-6 p-4">
        <h2 className="text-xl font-[550] w-full font-nohemi">Hero Animation</h2>

        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => handleReload("A")}
            className="text-xl font-nohemi text-zinc-900 opacity-50 dark:text-zinc-100 transition-opacity"
            initial={{ fontWeight: 300 }}
            whileHover={{ fontWeight: 600, opacity: 0.8 }}
            whileTap={{ fontWeight: 200, opacity: 0.1 }}
            aria-label="Reload Animation A"
          >
            Reload(A)
          </motion.button>

          <motion.button
            onClick={() => handleReload("B")}
            className="text-xl font-nohemi text-zinc-900 opacity-50 dark:text-zinc-100 transition-opacity"
            initial={{ fontWeight: 300 }}
            whileHover={{ fontWeight: 600, opacity: 0.8 }}
            whileTap={{ fontWeight: 200, opacity: 0.1 }}
            aria-label="Reload Animation B"
          >
            Reload(B)
          </motion.button>
        </div>
      </div>
    </section>
  );
}

