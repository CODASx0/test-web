"use client";

import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ease-out-cubic - 用于元素进入/退出
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

export interface Step {
  id: number;
  name: string;
}

interface StepControllerProps {
  steps: readonly Step[];
  currentStep: number;
  onStepChange: (step: number, direction: "prev" | "next" | "direct") => void;
}

// 左箭头图标
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 右箭头图标
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StepController({
  steps,
  currentStep,
  onStepChange,
}: StepControllerProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // 下一步
  const goNext = useCallback(() => {
    if (!isLast) {
      onStepChange(currentStep + 1, "next");
    }
  }, [currentStep, isLast, onStepChange]);

  // 上一步
  const goPrev = useCallback(() => {
    if (!isFirst) {
      onStepChange(currentStep - 1, "prev");
    }
  }, [currentStep, isFirst, onStepChange]);

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中触发
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)]"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: EASE_OUT_CUBIC,
        delay: 0.2,
      }}
      style={{ x: "-50%" }}
    >
      {/* 上一步按钮 */}
      <motion.button
        type="button"
        onClick={goPrev}
        disabled={isFirst}
        className="size-9 flex items-center justify-center rounded-xl text-zinc-500 transition-colors duration-150 ease [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-100 [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        aria-label="上一步"
      >
        <ChevronLeft />
      </motion.button>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-1 px-1">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          return (
            <motion.button
              key={step.id}
              type="button"
              onClick={() => {
                if (step.id !== currentStep) {
                  onStepChange(
                    step.id,
                    step.id < currentStep ? "prev" : "next"
                  );
                }
              }}
              className={`relative flex items-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-colors duration-150 ease ${
                isActive
                  ? "text-white"
                  : "text-zinc-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-700 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-100"
              }`}
              style={{
                fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              aria-current={isActive ? "step" : undefined}
            >
              {/* 活跃状态背景 */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-zinc-900 rounded-xl"
                  layoutId="activeStep"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 px-3">
                <span
                  className={`size-5 flex items-center justify-center rounded-md text-[11px] font-semibold ${
                    isActive ? "bg-white/15" : "bg-zinc-200/80"
                  }`}
                >
                  {step.id + 1}
                </span>
                <span className="tracking-tight">{step.name}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* 下一步按钮 */}
      <motion.button
        type="button"
        onClick={goNext}
        disabled={isLast}
        className="size-9 flex items-center justify-center rounded-xl text-zinc-500 transition-colors duration-150 ease [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-100 [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        aria-label="下一步"
      >
        <ChevronRight />
      </motion.button>

      {/* 快捷键提示 */}
      <div className="flex items-center gap-1 pl-2 pr-1 ml-1 border-l border-zinc-200">
        <kbd className="h-5 min-w-5 flex items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400 font-medium px-1">
          ←
        </kbd>
        <kbd className="h-5 min-w-5 flex items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400 font-medium px-1">
          →
        </kbd>
      </div>
    </motion.div>
  );
}
