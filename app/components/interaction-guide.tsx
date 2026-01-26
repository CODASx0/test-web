"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";

interface InteractionGuideProps {
  currentStep: number;
}

interface ButtonMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

const TARGET_SELECTORS: Record<number, string> = {
  1: '[data-guide-target="generate"]',
  2: '[data-guide-target="next-step"]',
  3: '[data-guide-target="start-recipe"]',
};

// 扩散波纹
function Ripple({ delay, borderRadius }: { delay: number; borderRadius: number }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ borderRadius }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        boxShadow: [
          "0 0 0 0px rgba(134, 61, 251, 0.6), 0 0 16px 0px rgba(134, 61, 251, 0.3)",
          "0 0 0 6px rgba(134, 61, 251, 0.4), 0 0 24px 4px rgba(134, 61, 251, 0.2)",
          "0 0 0 12px rgba(134, 61, 251, 0), 0 0 32px 8px rgba(134, 61, 251, 0)",
        ],
      }}
      transition={{
        duration: 1.0,
        delay,
        repeat: Infinity,
        repeatDelay: 1.4, // 总周期 2.4s (0.3 + 0.3 + 1.8) - 动画时长 1.0s = 1.4s
        ease: "easeOut",
      }}
    />
  );
}

export default function InteractionGuide({ currentStep }: InteractionGuideProps) {
  const [metrics, setMetrics] = useState<ButtonMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastMetricsRef = useRef<ButtonMetrics | null>(null);

  const updateMetrics = useCallback(() => {
    const selector = TARGET_SELECTORS[currentStep];
    if (!selector) {
      setIsVisible(false);
      return;
    }

    const targetElement = document.querySelector(selector) as HTMLButtonElement | null;
    if (!targetElement) {
      setIsVisible(false);
      return;
    }

    const computedStyle = window.getComputedStyle(targetElement);
    const isElementVisible = computedStyle.opacity !== "0" && computedStyle.visibility !== "hidden";
    const isDisabled = targetElement.disabled;

    if (!isElementVisible || isDisabled) {
      setIsVisible(false);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setIsVisible(false);
      return;
    }

    const borderRadius = parseFloat(computedStyle.borderRadius) || 12;

    const newMetrics: ButtonMetrics = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      borderRadius,
    };

    if (
      !lastMetricsRef.current ||
      Math.abs(lastMetricsRef.current.x - newMetrics.x) > 0.5 ||
      Math.abs(lastMetricsRef.current.y - newMetrics.y) > 0.5
    ) {
      lastMetricsRef.current = newMetrics;
      setMetrics(newMetrics);
    }

    setIsVisible(true);
  }, [currentStep]);

  useEffect(() => {
    const tick = () => {
      updateMetrics();
      rafRef.current = requestAnimationFrame(tick);
    };
    const timer = setTimeout(tick, 100);
    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateMetrics]);

  useEffect(() => {
    lastMetricsRef.current = null;
    setIsVisible(false);
    const timer = setTimeout(updateMetrics, 300);
    return () => clearTimeout(timer);
  }, [currentStep, updateMetrics]);

  return (
    <AnimatePresence>
      {isVisible && metrics && (
        <motion.div
          className="fixed z-[100] pointer-events-none"
          style={{
            left: metrics.x,
            top: metrics.y,
            width: metrics.width,
            height: metrics.height,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <Ripple delay={0} borderRadius={metrics.borderRadius} />
          <Ripple delay={0.3} borderRadius={metrics.borderRadius} />
          <Ripple delay={0.6} borderRadius={metrics.borderRadius} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
