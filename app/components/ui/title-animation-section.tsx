"use client";

import {
  motion,
  useAnimation,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"
import { useEffect, useRef, useState } from "react"

export function TitleAnimationSection() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const controls = useAnimation()
  const isInView = useInView(titleRef, {
    margin: "-30% 0% -30% 0%",
    once: false,
  })
  const { scrollY } = useScroll()
  const lastScrollY = useRef(0)
  const scrollDirection = useRef<"up" | "down">("down")

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > lastScrollY.current) {
      scrollDirection.current = "down"
    } else if (latest < lastScrollY.current) {
      scrollDirection.current = "up"
    }
    lastScrollY.current = latest
  })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else if (!isInView && scrollDirection.current === "up") {
      controls.start("hidden")
    }
  }, [controls, isInView])

  const lines = [
    ["Chat", "it."],
    ["Create", "it."],
  ]
  let wordCounter = 0

  return (
    <section className="relative h-screen w-full bg-white border-b border-black/5">
      <div className="flex flex-col h-full w-full items-center justify-center text-slate-700 gap-[56px]">
        <div className="flex flex-col items-start w-full max-w-[720px] mx-auto gap-0">
          <h1
            ref={titleRef}
            className="text-[54px] font-bold font-nohemi leading-[1.1] text-left min-h-[140px]"
          >
            {lines.map((line, lineIndex) => (
              <span key={`line-${lineIndex}`} className="block">
                {line.map((word) => {
                  const delayIndex = wordCounter++
                  return (
                    <motion.span
                      key={`word-${lineIndex}-${delayIndex}`}
                      variants={{
                        hidden: {
                          opacity: 0,
                          y: 10,
                          filter: "blur(12px)",
                          transition: { duration: 0.25, ease: "easeOut" },
                        },
                        visible: {
                          opacity: 1,
                          y: 0,
                          filter: "blur(0px)",
                          transition: {
                            type: "spring",
                            stiffness: 100,
                            damping: 30,
                            mass: 2,
                            delay: delayIndex * 0.12,
                          },
                        },
                      }}
                      initial="hidden"
                      animate={controls}
                      className="inline-block mr-3"
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {word}
                    </motion.span>
                  )
                })}
              </span>
            ))}
          </h1>

          <motion.button
            variants={{
              hidden: {
                opacity: 0,
                y: 10,
                filter: "blur(16px)",
                transition: { duration: 0.25, ease: "easeOut" },
              },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  type: "spring",
                  stiffness: 100,
                  damping: 30,
                  mass: 2,
                  delay: 0.45,
                },
              },
            }}
            initial="hidden"
            animate={controls}
            className="flex items-center gap-2 rounded-[999px] bg-black px-4 py-[5px] font-manrope text-white transition-opacity hover:opacity-80"
          >
            <span>Start For Free</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="inline-block"
            >
              <path
                d="M4 12L12 4M12 4H6M12 4V10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </div>

        

        
      </div>

      <div className="absolute top-0 left-0 z-10 p-4">
        <h2 className="text-xl font-semibold font-nohemi">Title Animation</h2>
      </div>
    </section>
  );
}

