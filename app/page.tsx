"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Dialog from "./components/dialog";
import CmdboxForOnboarding from "./components/cmdbox-for-onboarding";
import StepController from "./components/step-controller";

// ease-out-cubic - 用于元素进入/退出
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

// 步骤定义
const STEPS = [
  { id: 0, name: "Dialog" },
  { id: 1, name: "Cmdbox" },
] as const;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [cmdboxKey, setCmdboxKey] = useState(0); // 用于重置 CmdboxForOnboarding 的状态

  const isDialogVisible = currentStep === 0;
  const isExpanded = currentStep === 1;

  const handleStartNow = useCallback(() => {
    setCurrentStep(1);
  }, []);

  // 步骤变更处理
  const handleStepChange = useCallback(
    (step: number, direction: "prev" | "next" | "direct") => {
      // 如果是返回上一步或直接跳到前面的步骤，需要重置 cmdbox 状态
      if (direction === "prev" || (direction === "direct" && step < currentStep)) {
        setCmdboxKey((k) => k + 1);
      }
      setCurrentStep(step);
    },
    [currentStep]
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#f4f4f5]">
      <div className="absolute inset-0 bg-black/25" />

      {/* 步骤控制器 */}
      <StepController
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={handleStepChange}
      />
      
      {/* CmdboxForOnboarding - 从上往下移动 40px 并淡入 */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        initial={{ y: -40, opacity: 0 }}
        animate={{ 
          y: isExpanded ? 0 : -40,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{
          duration: 0.4,
          ease: EASE_OUT_CUBIC,
        }}
      >
        <CmdboxForOnboarding key={cmdboxKey} isExpanded={isExpanded} />
      </motion.div>

      {/* Dialog - 向下位移 20px 并淡出 */}
      <AnimatePresence>
        {isDialogVisible && (
          <motion.div
            className="relative z-20"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 0.3,
              ease: EASE_OUT_CUBIC,
            }}
          >
            <Dialog onStartNow={handleStartNow} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
