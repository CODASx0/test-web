"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Dialog from "./components/dialog";
import CmdboxForOnboarding from "./components/cmdbox-for-onboarding";
import ChatPanel from "./components/chat-panel";
import StepController from "./components/step-controller";
import OnboardingModal from "./components/onboarding-modal";
import Confetti from "./components/confetti";
import InteractionGuide from "./components/interaction-guide";

// ease-out-cubic - 用于元素进入/退出
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

// 步骤定义
const STEPS = [
  { id: 0, name: "Dialog" },
  { id: 1, name: "Cmdbox" },
  { id: 2, name: "Chatpanel" },
  { id: 3, name: "Modal" },
] as const;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [cmdboxKey, setCmdboxKey] = useState(0); // 用于重置 CmdboxForOnboarding 的状态
  const [chatPanelKey, setChatPanelKey] = useState(0); // 用于重置 ChatPanel 的状态
  const [confettiKey, setConfettiKey] = useState(0); // 用于重置 Confetti 的状态
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStep, setPrevStep] = useState(0);
  const [isNaturalTransition, setIsNaturalTransition] = useState(false); // 是否是自然跳转到 modal

  const isDialogVisible = currentStep === 0;
  const isExpanded = currentStep === 1;
  // ChatPanel 可见性：step 2 时可见，step 3 时只有自然跳转才保留
  const isChatPanelVisible = currentStep === 2 || (currentStep === 3 && isNaturalTransition);
  const isModalVisible = currentStep === 3;
  // 左侧 dialog 只在 step 2 可见
  const isOnboardingDialogVisible = currentStep === 2;

  // 当切换到 Modal 步骤时触发彩带效果
  useEffect(() => {
    if (currentStep === 3 && prevStep !== 3) {
      // 每次进入都创建新的彩带实例
      setConfettiKey((k) => k + 1);
      // 延迟一点触发，让 modal 入场动画先开始
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 200);
      return () => clearTimeout(timer);
    }
    setPrevStep(currentStep);
  }, [currentStep, prevStep]);

  // 彩带动画完成后重置状态
  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const handleStartNow = useCallback(() => {
    // 当从 Dialog 点击 Start Now 时，如果之前不在 Cmdbox，重置状态以触发打字机动画
    if (currentStep !== 1) {
      setCmdboxKey((k) => k + 1);
    }
    setCurrentStep(1);
  }, [currentStep]);

  // Cmdbox Generate 按钮点击后跳转到 ChatPanel
  const handleGenerate = useCallback(() => {
    setCurrentStep(2);
  }, []);

  // ChatPanel 进度2完成后跳转到 Modal（自然跳转）
  const handleProgress2Complete = useCallback(() => {
    setIsNaturalTransition(true);
    setCurrentStep(3);
  }, []);

  // 步骤变更处理（手动切换）
  const handleStepChange = useCallback(
    (step: number, direction: "prev" | "next" | "direct") => {
      // 手动切换时重置自然跳转状态
      setIsNaturalTransition(false);
      // 当跳转到 Cmdbox 步骤时，如果之前不在 Cmdbox，需要重置状态以触发打字机动画
      if (step === 1 && currentStep !== 1) {
        setCmdboxKey((k) => k + 1);
      }
      // 当跳转到 ChatPanel 步骤时，如果之前不在 ChatPanel，需要重置状态从进度1开始
      if (step === 2 && currentStep !== 2) {
        setChatPanelKey((k) => k + 1);
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
        <CmdboxForOnboarding key={cmdboxKey} isExpanded={isExpanded} onGenerate={handleGenerate} />
      </motion.div>

      {/* ChatPanel - 无整体入场动画，直接显示/隐藏 */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isChatPanelVisible ? 1 : 0,
          pointerEvents: isChatPanelVisible ? "auto" : "none",
        }}
        transition={{
          duration: 0.3,
          ease: EASE_OUT_CUBIC,
        }}
      >
        <ChatPanel 
          key={chatPanelKey}
          isVisible={isChatPanelVisible} 
          isOnboardingDialogVisible={isOnboardingDialogVisible}
          onProgress2Complete={handleProgress2Complete} 
        />
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

      {/* OnboardingModal - 从顶部 24px 位置进入 */}
      <motion.div
        className="absolute left-1/2 top-6 -translate-x-1/2 z-20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: isModalVisible ? 0 : -20,
          opacity: isModalVisible ? 1 : 0,
          pointerEvents: isModalVisible ? "auto" : "none",
        }}
        transition={{
          duration: 0.3,
          ease: EASE_OUT_CUBIC,
        }}
      >
        <OnboardingModal onStartWithRecipe={() => {}} />
      </motion.div>

      {/* Confetti 彩带碎屑效果 - 每次进入 Modal 都重新创建实例 */}
      <Confetti key={confettiKey} isActive={showConfetti} onComplete={handleConfettiComplete} />

      {/* 全局交互引导指示器 - 在步骤 2/3/4 的可点击按钮下方显示 */}
      <InteractionGuide currentStep={currentStep} />
    </main>
  );
}
