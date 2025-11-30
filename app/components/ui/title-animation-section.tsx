"use client";

import {
  motion,
  useAnimation,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"
import { useEffect, useRef, useState } from "react"

function LinkArrowButton({ children }: { children: React.ReactNode }) {
  const tweenTransition = {
    type: "tween" as const,
    ease: "circOut" as const,
    duration: 0.5,
  }

  const ArrowIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <polyline
        points="4.518 2.666 9.356 2.666 9.356 7.504"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="4.515"
        y1="7.503"
        x2="9.337"
        y2="2.682"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  return (
    <motion.button
      className="group relative flex items-center justify-center bg-black font-manrope font-bold text-white cursor-pointer"
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: { 
          paddingLeft: 16, 
          paddingRight: 12, 
          paddingTop: 6, 
          paddingBottom: 6, 
          borderRadius: 20,
        },
        hover: { 
          paddingLeft: 10, 
          paddingRight: 16, 
          paddingTop: 6, 
          paddingBottom: 6, 
          borderRadius: 0,
        },
      }}
      transition={tweenTransition}
      style={{ borderRadius: 20 }}
    >
      {/* Left Arrow Container - with overflow clip for mask effect */}
      <motion.div
        className="flex items-center justify-end overflow-hidden"
        variants={{
          rest: { width: 0, paddingRight: 0 },
          hover: { width: 24, paddingRight: 8 },
        }}
        transition={tweenTransition}
      >
        <motion.div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 16, height: 16 }}
          variants={{
            rest: { x: 24, rotate: 45 },
            hover: { x: 0, rotate: 45 },
          }}
          transition={tweenTransition}
        >
          <ArrowIcon />
        </motion.div>
      </motion.div>

      {/* Text */}
      <span className="block whitespace-nowrap">{children}</span>

      {/* Right Arrow Container - with overflow clip for mask effect */}
      <motion.div
        className="flex items-center justify-start overflow-hidden"
        variants={{
          rest: { width: 18, paddingLeft: 2 },
          hover: { width: 0, paddingLeft: 0 },
        }}
        transition={tweenTransition}
      >
        <motion.div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 16, height: 16 }}
          variants={{
            rest: { x: 0, rotate: 0 },
            hover: { x: -24, rotate: 45 },
          }}
          transition={tweenTransition}
        >
          <ArrowIcon />
        </motion.div>
      </motion.div>
    </motion.button>
  )
}

export function TitleAnimationSection() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const controls = useAnimation()
  const [isButtonHovered, setIsButtonHovered] = useState(false)
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
              <motion.span 
                key={`line-${lineIndex}`} 
                className="block"
                animate={isButtonHovered ? { y: -10 } : { y: 0 }}
                transition={{
                  type: "spring",
                  duration: 0.7,
                  bounce: 0,
                  delay: isButtonHovered ? (lines.length - 1 - lineIndex) * 0.08 : 0,
                }}
              >
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
              </motion.span>
            ))}
          </h1>

          <motion.div
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
            onHoverStart={() => setIsButtonHovered(true)}
            onHoverEnd={() => setIsButtonHovered(false)}
          >
            <LinkArrowButton>Start For Free</LinkArrowButton>
          </motion.div>
        </div>

        

        
      </div>

      <div className="absolute top-0 left-0 z-10 p-4">
        <h2 className="text-xl font-semibold font-nohemi">Title Animation</h2>
      </div>
    </section>
  );
}

