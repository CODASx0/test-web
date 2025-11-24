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
    <section className="relative h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col h-full w-full items-center justify-center text-zinc-400 gap-[64px]">
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

        <motion.div
          key={`hero-panel-${animationMode}-${key}`}
          initial={{
            opacity: 0,
            filter: "blur(30px)",
            height: "150px",
            maxWidth: "876px",
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            height: "165px",
            width: "100%",
            maxWidth: "956px",
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: animationMode === "A" ? 0.6 : 0.4,
            maxWidth: {
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
          className="mt-6 h-[165px] w-full max-w-[956px] rounded-[32px] bg-white/5"
        />
      </div>

      <div className="absolute top-0 left-0 z-10 flex items-center gap-6 p-4">
        <h2 className="text-xl font-[550] font-nohemi">Hero Animation</h2>

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

