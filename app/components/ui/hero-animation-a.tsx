import type { ComponentProps } from "react"
import { motion } from "framer-motion"

import { Typewriter } from "./typewriter"

type TypewriterOptions = Omit<ComponentProps<typeof Typewriter>, "text">

interface HeroAnimationAProps {
  title: string
  subtitle: string
  animationKey?: string | number
  typewriterOptions?: TypewriterOptions
}

export function HeroAnimationA({
  title,
  subtitle,
  animationKey,
  typewriterOptions,
}: HeroAnimationAProps) {
  const words = subtitle.split(" ")

  return (
    <div className="flex flex-col items-center gap-[4px] text-center">
      <h1
        key={`${animationKey}-title`}
        className="font-nohemi text-[60px] text-center leading-[1.1] whitespace-pre-line min-h-[150px]"
      >
        <Typewriter
          key={`${animationKey}-typewriter`}
          text={title}
          className="justify-center"
          {...typewriterOptions}
        />
      </h1>

      <h2
        key={`${animationKey}-subtitle`}
        className="text-xl font-[500] font-manrope"
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            initial={{ opacity: 0, filter: "blur(16px)" }}
            animate={{ opacity: 0.4, filter: "blur(0px)" }}
            transition={{
              filter: {
                type: "spring",
                stiffness: 30,
                damping: 10,
                delay: 3 + index * 0.1,
              },
              opacity: {
                duration: 1.6,
                ease: "easeInOut",
                delay: 3 + index * 0.1,
              },
            }}
            style={{ display: "inline-block", marginRight: "0.25em" }}
          >
            {word}
          </motion.span>
        ))}
      </h2>
    </div>
  )
}

