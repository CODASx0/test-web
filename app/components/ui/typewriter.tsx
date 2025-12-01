import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface TypewriterProps {
  text: string
  charDelay?: number
  wordDelay?: number
  lineDelay?: number
  charDelayJitter?: number
  initialDelay?: number
  className?: string
  showCursor?: boolean
  cursorChar?: string | React.ReactNode
  cursorClassName?: string
  cursorHideDelay?: number
  /**
   * Optional map of specific words to additional pause durations (ms) once those words are completed.
   */
  wordPause?: Record<string, number>
}

const Typewriter = ({
  text,
  charDelay = 55,
  wordDelay = 120,
  lineDelay = 800,
  charDelayJitter = 20,
  initialDelay = 0,
  className,
  showCursor = true,
  cursorChar = "|",
  cursorClassName,
  cursorHideDelay = 2400,
  wordPause = {
    Chat: 300,
    way: 500,
    to: 330,
  },
}: TypewriterProps) => {
  const [displayed, setDisplayed] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const [blinkOn, setBlinkOn] = useState(true)
  const wordPauseRef = useRef(wordPause)

  useEffect(() => {
    wordPauseRef.current = wordPause
  }, [wordPause])

  useEffect(() => {
    setDisplayed("")
    setIsTyping(true)
    setCursorVisible(true)

    let index = 0
    let timeout: number | null = null

    const scheduleNext = (delay: number) => {
      timeout = window.setTimeout(() => {
        index += 1
        setDisplayed(text.slice(0, index))

        if (index >= text.length) {
          setIsTyping(false)
            return
          }

        const nextChar = text[index]
        const isBoundary = nextChar === " " || nextChar === "\n" || nextChar === "\t" || nextChar === undefined
        const baseDelay = isBoundary ? wordDelay : charDelay
        let extraWordPause = 0
        if (isBoundary) {
          const typed = text
            .slice(0, index)
            .trimEnd()
            .split(/\s+/)
            .pop()
          if (typed) {
            const normalized = typed.replace(/[.,!?;:]+$/, "")
            extraWordPause = wordPauseRef.current[normalized] ?? 0
          }
        }
        const previousChar = text[index - 1]
        const postLineDelay = previousChar === "\n" ? lineDelay : 0
        const jitter = (Math.random() * 2 - 1) * charDelayJitter
        const nextDelay = Math.max(15, baseDelay + extraWordPause + postLineDelay + jitter)

        scheduleNext(nextDelay)
      }, delay)
    }

    scheduleNext(Math.max(0, initialDelay))

    return () => {
      if (timeout) {
        clearTimeout(timeout)
        }
      }
  }, [text, charDelay, wordDelay, lineDelay, charDelayJitter, initialDelay])

  useEffect(() => {
    if (isTyping) {
      setCursorVisible(true)
      return
    }

    const timeout = window.setTimeout(() => setCursorVisible(false), cursorHideDelay)
    return () => clearTimeout(timeout)
  }, [isTyping, cursorHideDelay])

  useEffect(() => {
    if (!cursorVisible) {
      setBlinkOn(false)
      return
    }

    setBlinkOn(true)
    const interval = window.setInterval(() => {
      setBlinkOn((prev) => !prev)
    }, 450)

    return () => clearInterval(interval)
  }, [cursorVisible])

  const renderedChars = displayed.split("")

  return (
    <span className={`inline-block min-h-[1em] whitespace-pre-line tracking-tight ${className ?? ''}`}>
      {renderedChars.length === 0
        ? "\u00A0"
        : renderedChars.map((char, idx) => {
            if (char === "\n") {
              return <br key={`br-${idx}`} />
            }

            const symbol = char === " " ? "\u00A0" : char
            return (
        <motion.span
                key={`char-${idx}-${symbol}`}
                initial={{ fontWeight: 100 }}
                animate={{ fontWeight: 600 }}
                transition={{
                  type: "spring", 
                  stiffness: 200,
                  damping: 20,
                  
                }}
                style={{ display: "inline-block" }}
              >
                {symbol}
              </motion.span>
            )
          })}
      {showCursor && cursorVisible && (
        <span
          aria-hidden="true"
          className={`inline-block align-baseline ${cursorClassName ?? ''}`}
          style={{ opacity: blinkOn ? 1 : 0 }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  )
}

export { Typewriter }
