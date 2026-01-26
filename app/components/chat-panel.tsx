"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

// 动画曲线 - 参考 dialog.tsx
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

// 动画配置 - 复刻 dialog.tsx 的参数
const ANIMATION_CONFIG = {
  bubbleDelayStep: 0.08, // 每个 bubble 之间的延迟
  initialDelay: 0.3, // 初始延迟
  springDuration: 0.35, // spring 动画时长 (300ms)
  springBounce: 0.2, // spring 弹性系数
  dialogStepInterval: 1.8, // 左侧面板步骤间隔
};

// 左侧面板任务项配置
const DIALOG_TASKS = [
  { id: "task1", text: "Picking the right visuals with Nano Banana Pro and more." },
  { id: "task2", text: "Bringing scenes to life with Veo3, Keling 2.6 Pro and more." },
  { id: "task3", text: "Putting it all together." },
  { id: "task4", text: "Watch the preview." },
];

// 第二页任务
const DIALOG_TASKS_PAGE2 = [
  { id: "task1-p2", text: "Try to modify the content through language descriptions." },
  { id: "task2-p2", text: "Click the send button and wait for the result." },
];

// 进度条值映射
const PROGRESS_VALUES = ["0", "25", "50", "75", "100", "inactive"] as const;
type ProgressValue = typeof PROGRESS_VALUES[number];

// 进度条动画配置
const PROGRESS_CONFIG = {
  pxPerSecond: 12, // 每秒增长 20px
  stopBeforeTarget: 3, // 在目标值前 3% 停止
  transitionLerpFactor: 0.12, // 平滑过渡的 lerp 系数
};

// 进度条组件 - 持续增长动画
interface ProgressBarProps {
  value: ProgressValue;
  className?: string;
  isStatic?: boolean; // 是否静止（不执行动画）
}

function ProgressBar({ value, className, isStatic = false }: ProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentWidth, setCurrentWidth] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const prevTargetRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  // 当前 step 对应的目标值
  const targetMap: Record<ProgressValue, number> = {
    "0": 0,
    "25": 25,
    "50": 50,
    "75": 75,
    "100": 100,
    "inactive": 100,
  };

  // 下一个 step 的目标值（用于确定停止点）
  const nextTargetMap: Record<ProgressValue, number> = {
    "0": 25,
    "25": 50,
    "50": 75,
    "75": 100,
    "100": 100,
    "inactive": 100,
  };

  const currentTarget = targetMap[value];
  const nextTarget = nextTargetMap[value];
  const isInactive = value === "inactive";

  // 监听目标值变化，触发平滑过渡
  useEffect(() => {
    if (currentTarget !== prevTargetRef.current) {
      isTransitioningRef.current = true;
      prevTargetRef.current = currentTarget;
    }
  }, [currentTarget]);

  useEffect(() => {
    // 如果是静止状态
    if (isStatic) {
      // inactive 状态下应该是 100% 宽度，否则是 0%
      setCurrentWidth(isInactive ? 100 : 0);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const containerWidth = container.offsetWidth;
      if (containerWidth === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // 每秒增长的百分比
      const percentPerSecond = (PROGRESS_CONFIG.pxPerSecond / containerWidth) * 100;
      // 停止点：在下一个目标值前停止
      const stopPoint = Math.max(currentTarget, nextTarget - PROGRESS_CONFIG.stopBeforeTarget);

      setCurrentWidth((prev) => {
        // 如果正在平滑过渡到当前目标值
        if (isTransitioningRef.current) {
          const diff = currentTarget - prev;
          if (Math.abs(diff) < 0.3) {
            isTransitioningRef.current = false;
            return currentTarget;
          }
          return prev + diff * PROGRESS_CONFIG.transitionLerpFactor;
        }

        // 正常增长模式：以固定速度增长，在停止点前停止
        if (prev < stopPoint) {
          const newValue = prev + percentPerSecond * deltaTime;
          return Math.min(newValue, stopPoint);
        }

        return prev;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [currentTarget, nextTarget, isStatic, isInactive]);

  return (
    <div
      ref={containerRef}
      className={`bg-[#f4f4f5] flex-1 h-full rounded-full overflow-hidden relative ${className || ""}`}
    >
      {/* 进度条填充 */}
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-colors duration-300 ${
          isInactive ? "bg-[rgba(134,61,251,0.16)]" : "bg-[#863dfb]"
        }`}
        style={{ width: `${currentWidth}%` }}
      />
    </div>
  );
}

// 圆圈图标（等待中）
function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#3f3f46" strokeWidth="1.5" />
    </svg>
  );
}

// 勾选图标（已完成）
function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5Z"
        fill="#3f3f46"
      />
      <path
        d="M11 6L7 10L5 8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 加载进度指示器（正在进行）
function LoadingSpinner() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="#3f3f46"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="28.27"
        strokeDashoffset="21.2"
      />
    </motion.svg>
  );
}

// 任务项组件
interface TaskItemProps {
  text: string;
  isCompleted: boolean;
  isActive: boolean; // 正在进行中（显示 loading）
  isPending?: boolean; // 待加载状态（空心圆但 opacity 100%）
}

function TaskItem({ text, isCompleted, isActive, isPending = false }: TaskItemProps) {
  // 计算 opacity：
  // - 正在进行中（isActive）或待加载（isPending）：100%
  // - 已完成和等待中：30%
  const opacity = (isActive || isPending) && !isCompleted ? 1 : 0.3;

  // 渲染图标：已完成=勾选，正在进行=加载器，待加载/等待中=空心圆
  const renderIcon = () => {
    if (isCompleted) {
      return <CheckCircleIcon />;
    }
    if (isActive) {
      return <LoadingSpinner />;
    }
    // isPending 或等待中都显示空心圆
    return <CircleIcon />;
  };

  return (
    <motion.div
      className="flex gap-2.5 items-start relative shrink-0 w-full"
      animate={{ opacity }}
      transition={{ duration: 0.2, ease: EASE_OUT_CUBIC }}
    >
      <div className="flex flex-col items-start justify-center pt-0.5 relative shrink-0">
        <motion.div
          initial={false}
          animate={{ scale: isCompleted ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.2 }}
        >
          {renderIcon()}
        </motion.div>
      </div>
      <p
        className="flex-1 font-medium leading-5 text-[#3f3f46] text-sm tracking-[0.2px]"
        style={{
          fontFamily: "var(--font-manrope, Manrope, sans-serif)",
          fontFeatureSettings: "'zero'",
        }}
      >
        {text}
      </p>
    </motion.div>
  );
}

// 左侧 OnboardingDialog 组件
interface OnboardingDialogProps {
  currentStep: number;
  isPage2: boolean;
  isPage2Started: boolean; // 第二页动画是否已开始
  onNextStepClick: () => void; // Next Step 按钮点击回调
}

function OnboardingDialog({ currentStep, isPage2, isPage2Started, onNextStepClick }: OnboardingDialogProps) {
  // 第一页：进度条1 动画，步骤 0-4 对应 0%/25%/50%/75%/100%
  // 第二页：进度条1 显示 inactive 状态
  const progress1Value = isPage2 ? "inactive" : (PROGRESS_VALUES[currentStep] || "0");
  
  // 第二页进度条2 的值映射（2个任务: 0%, 50%, 100%）
  const PAGE2_PROGRESS_VALUES = ["0", "50", "100"] as const;
  // 第二页未开始时保持 0%
  const progress2Value = isPage2 && isPage2Started ? (PAGE2_PROGRESS_VALUES[currentStep] || "0") : "0";
  
  const tasks = isPage2 ? DIALOG_TASKS_PAGE2 : DIALOG_TASKS;
  const title = isPage2 ? "Want to tweak it? Just say the word." : "Sit back. We're on it.";
  // 按钮激活条件：第二页且动画未开始
  const isButtonEnabled = isPage2 && !isPage2Started;

  return (
    <div className="bg-[#fafafa] border-[0.5px] border-[#d4d4d8] flex flex-col h-[413px] items-end overflow-hidden relative rounded-[24px] shadow-[0px_6px_2px_0px_rgba(0,0,0,0),0px_4px_1px_0px_rgba(0,0,0,0.01),0px_2px_1px_0px_rgba(0,0,0,0.03),0px_1px_1px_0px_rgba(0,0,0,0.04)] shrink-0 w-[376px]">
      {/* Header */}
      <div className="bg-white flex flex-col gap-5 items-start justify-center pb-2 pt-8 px-8 relative shrink-0 w-full z-[3]">
        {/* Progress bars */}
        <div className="flex gap-3 h-2 items-start relative shrink-0 w-full">
          {/* 进度条1：第一页时动画，第二页时静态显示 inactive */}
          <ProgressBar value={progress1Value as ProgressValue} isStatic={isPage2} />
          {/* 进度条2：第一页时静态，第二页开始后动画 */}
          <ProgressBar value={progress2Value as ProgressValue} isStatic={!isPage2 || !isPage2Started} />
        </div>
        {/* Title - 居左对齐 */}
        <div className="flex items-center relative shrink-0 w-full">
          <motion.h2
            key={title}
            className="flex-1 font-semibold text-2xl text-[#09090b] tracking-normal leading-8"
            style={{
              fontFamily: "var(--font-nohemi, sans-serif)",
              fontFeatureSettings: "'zero'",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_CUBIC }}
          >
            {title}
          </motion.h2>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gradient-to-b from-white to-[#fafafa] flex flex-1 flex-col gap-2 items-start overflow-hidden pb-8 pt-2.5 px-8 relative w-full z-[2]">
        {/* Task items */}
        {tasks.map((task, index) => {
          // 对于第一页：计算当前任务是否已完成或活跃
          // 对于第二页：需要考虑 isPage2Started 状态
          let isCompleted = false;
          let isActive = false;
          let isPending = false;
          
          if (isPage2) {
            if (!isPage2Started) {
              // 第二页未开始：第一个任务是待加载状态（空心圆，opacity 100%）
              isPending = index === 0;
            } else {
              // 第二页已开始：根据 currentStep 计算
              isCompleted = index < currentStep;
              isActive = index === currentStep && currentStep < tasks.length;
            }
          } else {
            isCompleted = index < currentStep;
            // 只有当前正在进行的任务才是活跃的
            // 步骤 4 时 currentStep >= tasks.length，所有任务都完成但都是灰色
            isActive = index === currentStep && currentStep < tasks.length;
          }

          return (
            <TaskItem
              key={task.id}
              text={task.text}
              isCompleted={isCompleted}
              isActive={isActive}
              isPending={isPending}
            />
          );
        })}

        {/* RecommendedLayer - 底部装饰视频层 */}
        <div className="absolute blur-[25px] bottom-[-36px] h-[40px] left-[34px] right-[34px] opacity-50 rounded-[999px] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-[999px]"
          >
            <source src="/layer.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t-[0.5px] border-[#e4e4e7] flex gap-3.5 items-center justify-end p-4 relative shrink-0 w-full z-[1]">
        <motion.button
          type="button"
          disabled={!isButtonEnabled}
          onClick={isButtonEnabled ? onNextStepClick : undefined}
          data-guide-target="next-step"
          className={`border-[0.5px] flex flex-col h-10 items-center justify-center overflow-hidden relative rounded-xl shrink-0 ${
            isButtonEnabled
              ? "border-[rgba(9,9,11,0.12)] bg-[#09090b] cursor-pointer"
              : "border-[rgba(9,9,11,0.12)] bg-[rgba(9,9,11,0.12)] cursor-not-allowed"
          }`}
          animate={{
            backgroundColor: isButtonEnabled ? "#09090b" : "rgba(9,9,11,0.12)",
          }}
          transition={{ duration: 0.2, ease: EASE_OUT_CUBIC }}
        >
          <div className="flex gap-1 items-center justify-center pl-6 pr-4 py-3 relative shrink-0 w-full">
            <span
              className={`flex flex-col font-medium justify-center relative shrink-0 text-sm text-center tracking-[0.1px] leading-5 ${
                isButtonEnabled ? "text-white" : "text-[#09090b] opacity-[0.38]"
              }`}
              style={{
                fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                fontFeatureSettings: "'zero'",
              }}
            >
              Next Step
            </span>
            <span className={`flex items-center relative shrink-0 ${isButtonEnabled ? "" : "opacity-[0.38]"}`}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.25 3.5L8.75 7L5.25 10.5"
                  stroke={isButtonEnabled ? "white" : "#09090b"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <span className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.2),inset_0px_5px_10px_0px_rgba(255,255,255,0.25)]" />
        </motion.button>
      </div>
    </div>
  );
}

// 颜色配置 - 严格还原设计稿
const USER_BUBBLE_COLOR = "bg-[rgba(134,61,251,0.16)]"; // 用户消息紫色
const AI_BUBBLE_COLOR = "bg-[rgba(74,68,89,0.08)]"; // AI 消息灰色


// 动画 Bubble 组件 - 复刻 dialog.tsx 中的动画参数
interface MessageBubbleProps {
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  isUser?: boolean;
  animationKey: number;
  isVisible?: boolean;
  onAnimationStart?: () => void; // 动画开始时的回调
}

function MessageBubble({
  className = "",
  style,
  delay = 0,
  isUser = false,
  animationKey,
  isVisible = true,
  onAnimationStart,
}: MessageBubbleProps) {
  const hasTriggeredRef = useRef(false);

  // 当 animationKey 变化时重置触发状态
  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [animationKey]);

  // 在 delay 后触发滚动（与动画开始同步）
  useEffect(() => {
    if (isVisible && onAnimationStart && !hasTriggeredRef.current) {
      const timer = setTimeout(() => {
        hasTriggeredRef.current = true;
        onAnimationStart();
      }, delay * 1000); // 与动画 delay 同步
      return () => clearTimeout(timer);
    }
    if (!isVisible) {
      hasTriggeredRef.current = false;
    }
  }, [isVisible, delay, onAnimationStart]);

  return (
    <motion.div
      key={animationKey}
      className={className}
      initial={{ scaleX: 0, y: 20, opacity: 0 }}
      animate={
        isVisible
          ? { scaleX: 1, y: 0, opacity: 1 }
          : { scaleX: 0, y: 20, opacity: 0 }
      }
      transition={{
        scaleX: {
          type: "spring",
          duration: ANIMATION_CONFIG.springDuration,
          bounce: ANIMATION_CONFIG.springBounce,
          delay: isVisible ? delay : 0,
        },
        y: {
          type: "spring",
          duration: ANIMATION_CONFIG.springDuration,
          bounce: ANIMATION_CONFIG.springBounce,
          delay: isVisible ? delay : 0,
        },
        opacity: {
          duration: isVisible ? 0.1 : 0,
          delay: isVisible ? delay : 0,
        },
      }}
      style={{
        transformOrigin: isUser ? "right bottom" : "left bottom",
        ...style,
      }}
    />
  );
}

// Bubble 配置类型
type BubbleType = "single" | "grid";

interface SingleBubbleConfig {
  id: string;
  type: "single";
  height: number;
  width: number | "full";
  isUser: boolean;
}

interface GridBubbleConfig {
  id: string;
  type: "grid";
  height: number; // 整个 grid 的高度
  cols: number;
  rows: number;
}

type BubbleConfig = SingleBubbleConfig | GridBubbleConfig;

// 消息组配置
interface MessageGroupConfig {
  id: string;
  isUserGroup: boolean; // 用户消息组（右对齐，有 pl-48）
  bubbles: BubbleConfig[];
  linkedToStep: number; // 关联的 step（当该 step 开始时显示）
  page: 1 | 2; // 所属页面
}

// ===== 第一页气泡配置 =====
// p1-item-1-user: 用户消息
const p1Item1User: MessageGroupConfig = {
  id: "p1-item-1-user",
  isUserGroup: true,
  linkedToStep: 0,
  page: 1,
  bubbles: [
    { id: "p1-item-1-user-bubble", type: "single", height: 54, width: "full", isUser: true },
  ],
};

// p1-item-1-ai: AI 回复（大段消息 + 标签 + 网格 + 标签 + 网格）
const p1Item1Ai: MessageGroupConfig = {
  id: "p1-item-1-ai",
  isUserGroup: false,
  linkedToStep: 0,
  page: 1,
  bubbles: [
    { id: "p1-item-1-ai-1", type: "single", height: 178, width: "full", isUser: false },
    { id: "p1-item-1-ai-2", type: "single", height: 33, width: 125, isUser: false },
    { id: "p1-item-1-ai-grid-1", type: "grid", height: 228, cols: 3, rows: 2 },
    { id: "p1-item-1-ai-3", type: "single", height: 33, width: 125, isUser: false },
    { id: "p1-item-1-ai-grid-2", type: "grid", height: 228, cols: 3, rows: 2 },
  ],
};

// p1-item-2-ai: AI 回复（消息 + 标签 + 网格 + 标签 + 网格）
const p1Item2Ai: MessageGroupConfig = {
  id: "p1-item-2-ai",
  isUserGroup: false,
  linkedToStep: 1,
  page: 1,
  bubbles: [
    { id: "p1-item-2-ai-1", type: "single", height: 75, width: "full", isUser: false },
    { id: "p1-item-2-ai-2", type: "single", height: 33, width: 125, isUser: false },
    { id: "p1-item-2-ai-grid-1", type: "grid", height: 228, cols: 3, rows: 2 },
    { id: "p1-item-2-ai-3", type: "single", height: 33, width: 125, isUser: false },
    { id: "p1-item-2-ai-grid-2", type: "grid", height: 228, cols: 3, rows: 2 },
  ],
};

// p1-item-3-ai: AI 回复（标签 + 消息）
const p1Item3Ai: MessageGroupConfig = {
  id: "p1-item-3-ai",
  isUserGroup: false,
  linkedToStep: 2,
  page: 1,
  bubbles: [
    { id: "p1-item-3-ai-1", type: "single", height: 33, width: 125, isUser: false },
    { id: "p1-item-3-ai-2", type: "single", height: 180, width: "full", isUser: false },
  ],
};

// ===== 第二页气泡配置 =====
// p2-item-1-user: 用户消息
const p2Item1User: MessageGroupConfig = {
  id: "p2-item-1-user",
  isUserGroup: true,
  linkedToStep: 0,
  page: 2,
  bubbles: [
    { id: "p2-item-1-user-bubble", type: "single", height: 54, width: "full", isUser: true },
  ],
};

// p2-item-2-ai: AI 回复
const p2Item2Ai: MessageGroupConfig = {
  id: "p2-item-2-ai",
  isUserGroup: false,
  linkedToStep: 1,
  page: 2,
  bubbles: [
    { id: "p2-item-2-ai-1", type: "single", height: 75, width: "full", isUser: false },
    { id: "p2-item-2-ai-2", type: "single", height: 33, width: 125, isUser: false },
    { id: "p2-item-2-ai-grid-1", type: "grid", height: 228, cols: 3, rows: 2 },
    { id: "p2-item-2-ai-3", type: "single", height: 33, width: 125, isUser: false },
    { id: "p2-item-2-ai-grid-2", type: "grid", height: 228, cols: 3, rows: 2 },
  ],
};

// 所有消息组
const ALL_MESSAGE_GROUPS: MessageGroupConfig[] = [
  p1Item1User,
  p1Item1Ai,
  p1Item2Ai,
  p1Item3Ai,
  p2Item1User,
  p2Item2Ai,
];


interface ChatPanelProps {
  isVisible: boolean;
  isOnboardingDialogVisible?: boolean; // 左侧 dialog 是否可见
  onProgress2Complete?: () => void; // 进度2完成回调
}

export default function ChatPanel({ isVisible, isOnboardingDialogVisible = true, onProgress2Complete }: ChatPanelProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimationStarted, setIsAnimationStarted] = useState(false); // 动画是否已开始
  
  // 左侧面板动画状态
  const [dialogStep, setDialogStep] = useState(0); // 0-4: 任务步骤
  const [isDialogPage2, setIsDialogPage2] = useState(false);
  const [isPage2Started, setIsPage2Started] = useState(false); // 第二页动画是否已开始
  
  // 存储第二页动画的 timeouts，以便在点击按钮时启动
  const page2TimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // 滚动容器和 bubble refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 根据当前状态判断消息组是否应该显示
  const shouldShowGroup = useCallback((group: MessageGroupConfig) => {
    // 第一页的消息
    if (group.page === 1) {
      if (!isDialogPage2) {
        // 还在第一页，需要动画已开始且 step 达到
        if (!isAnimationStarted) return false;
        return group.linkedToStep <= dialogStep;
      } else {
        // 已切换到第二页，第一页所有消息都应该显示
        return true;
      }
    }
    
    // 第二页的消息：只有在第二页且动画已开始时才显示
    if (group.page === 2) {
      if (!isDialogPage2) return false;
      if (!isPage2Started) return false;
      return group.linkedToStep <= dialogStep;
    }
    
    return false;
  }, [dialogStep, isDialogPage2, isPage2Started, isAnimationStarted]);

  // 计算气泡的延迟 - 同一个 step 中的所有 bubble 顺次出现
  // group: 当前消息组
  // bubbleIndexInGroup: 该气泡在当前消息组中的索引
  const getBubbleDelay = useCallback((group: MessageGroupConfig, bubbleIndexInGroup: number) => {
    // 找出同一个 step 中，当前组之前的所有组
    const sameStepGroups = ALL_MESSAGE_GROUPS.filter(
      g => g.page === group.page && g.linkedToStep === group.linkedToStep
    );
    const groupIndexInStep = sameStepGroups.indexOf(group);
    
    // 计算当前组之前的所有 bubble 数量
    let priorBubbles = 0;
    for (let i = 0; i < groupIndexInStep; i++) {
      const priorGroup = sameStepGroups[i];
      for (const bubble of priorGroup.bubbles) {
        if (bubble.type === "single") {
          priorBubbles += 1;
        } else {
          priorBubbles += bubble.cols * bubble.rows;
        }
      }
    }
    
    return (priorBubbles + bubbleIndexInGroup) * ANIMATION_CONFIG.bubbleDelayStep;
  }, []);

  // 滚动到最新的 bubble - 让气泡底部对齐到容器底部（留 padding）
  const scrollToLatestBubble = useCallback((bubbleId: string) => {
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const bubbleElement = bubbleRefs.current.get(bubbleId);
      if (!container || !bubbleElement) return;
      
      const containerRect = container.getBoundingClientRect();
      const bubbleRect = bubbleElement.getBoundingClientRect();
      
      // 气泡底部在容器内的位置
      const bubbleBottomInContainer = bubbleRect.bottom - containerRect.top + container.scrollTop;
      
      // 目标滚动位置：气泡底部对齐到容器底部，留 16px padding
      const padding = 16;
      const targetScrollTop = bubbleBottomInContainer - container.clientHeight + padding;
      
      // 只有需要向下滚动时才滚动
      if (targetScrollTop > container.scrollTop) {
        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    });
  }, []);

  // 注册 bubble ref
  const registerBubbleRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      bubbleRefs.current.set(id, element);
    } else {
      bubbleRefs.current.delete(id);
    }
  }, []);

  // Next Step 按钮点击处理
  const handleNextStepClick = useCallback(() => {
    if (!isDialogPage2 || isPage2Started) return;
    
    setIsPage2Started(true);
    
    // 清除之前的第二页动画 timeouts
    page2TimeoutsRef.current.forEach(clearTimeout);
    page2TimeoutsRef.current = [];
    
    // 启动第二页动画
    // 步骤 1: 第二页进度 50%
    page2TimeoutsRef.current.push(setTimeout(() => {
      setDialogStep(1);
    }, ANIMATION_CONFIG.dialogStepInterval * 1000));

    // 步骤 2: 第二页进度 100%
    page2TimeoutsRef.current.push(setTimeout(() => {
      setDialogStep(2);
    }, ANIMATION_CONFIG.dialogStepInterval * 2 * 1000));

    // 进度2完成后延迟 0.5s 触发回调
    page2TimeoutsRef.current.push(setTimeout(() => {
      onProgress2Complete?.();
    }, (ANIMATION_CONFIG.dialogStepInterval * 2 + 0.5) * 1000));
  }, [isDialogPage2, isPage2Started, onProgress2Complete]);

  // 动画序列 - 第一页自动播放，第二页等待用户点击
  const runAnimationSequence = useCallback(() => {
    // 重置状态
    setDialogStep(0);
    setIsDialogPage2(false);
    setIsPage2Started(false);
    setIsAnimationStarted(false);
    
    // 清除第二页的 timeouts
    page2TimeoutsRef.current.forEach(clearTimeout);
    page2TimeoutsRef.current = [];
    
    // 重置滚动位置
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const timeouts: NodeJS.Timeout[] = [];

    // 初始延迟后开始动画
    timeouts.push(setTimeout(() => {
      setIsAnimationStarted(true);
    }, ANIMATION_CONFIG.initialDelay * 1000));

    // 左侧面板步骤动画 - 第一页（4 个任务，5 个步骤 0-4）
    // 步骤 1: 25% 进度
    timeouts.push(setTimeout(() => {
      setDialogStep(1);
    }, (ANIMATION_CONFIG.initialDelay + ANIMATION_CONFIG.dialogStepInterval) * 1000));

    // 步骤 2: 50% 进度
    timeouts.push(setTimeout(() => {
      setDialogStep(2);
    }, (ANIMATION_CONFIG.initialDelay + ANIMATION_CONFIG.dialogStepInterval * 2) * 1000));

    // 步骤 3: 75% 进度
    timeouts.push(setTimeout(() => {
      setDialogStep(3);
    }, (ANIMATION_CONFIG.initialDelay + ANIMATION_CONFIG.dialogStepInterval * 3) * 1000));

    // 步骤 4: 100% 进度
    timeouts.push(setTimeout(() => {
      setDialogStep(4);
    }, (ANIMATION_CONFIG.initialDelay + ANIMATION_CONFIG.dialogStepInterval * 4) * 1000));

    // 步骤 5: 切换到第二页（暂停，等待用户点击 Next Step）
    timeouts.push(setTimeout(() => {
      setIsDialogPage2(true);
      setDialogStep(0);
    }, (ANIMATION_CONFIG.initialDelay + ANIMATION_CONFIG.dialogStepInterval * 5) * 1000));

    // 注意：第二页动画不在这里启动，而是由用户点击 Next Step 按钮触发

    return () => {
      timeouts.forEach(clearTimeout);
      page2TimeoutsRef.current.forEach(clearTimeout);
      page2TimeoutsRef.current = [];
    };
  }, []);

  // 当 isVisible 变化时启动动画
  useEffect(() => {
    if (isVisible) {
      const cleanup = runAnimationSequence();
      return cleanup;
    }
  }, [isVisible, animationKey, runAnimationSequence]);

  return (
    <div className="flex gap-3 items-end">
      {/* 左侧 OnboardingDialog - 从左往右 20px 进入，渐隐退出 */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{
          x: isOnboardingDialogVisible ? 0 : 0,
          opacity: isOnboardingDialogVisible ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.215, 0.61, 0.355, 1], // ease-out-cubic
        }}
      >
        <OnboardingDialog 
          currentStep={dialogStep} 
          isPage2={isDialogPage2}
          isPage2Started={isPage2Started}
          onNextStepClick={handleNextStepClick}
        />
      </motion.div>

      {/* 右侧 ChatPanel - 精简版，只有消息气泡 */}
      <div className="bg-[#fafafa] border-[0.5px] border-[#e4e4e7] flex flex-col h-[700px] items-start max-w-[640px] min-w-[240px] overflow-hidden relative rounded-t-[20px] rounded-b-[24px] shrink-0 w-[376px]">
        {/* 可滚动的消息区域 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 w-full scrollbar-hide"
        >
          {/* Message group - 间距 16px */}
          <div className="flex flex-col gap-4 items-start relative w-full">
            {ALL_MESSAGE_GROUPS.map((group) => {
              const isVisible = shouldShowGroup(group);
              // 计算当前组内的气泡索引（用于同 step 顺次出现）
              let bubbleIndexInGroup = 0;
              
              return (
                <div
                  key={`${group.id}-${animationKey}`}
                  className={`flex flex-col gap-4 relative shrink-0 w-full ${
                    group.isUserGroup ? "items-end pl-12" : "items-start"
                  }`}
                >
                  {group.bubbles.map((bubble) => {
                    const delay = getBubbleDelay(group, bubbleIndexInGroup);
                    
                    if (bubble.type === "single") {
                      bubbleIndexInGroup += 1;
                      const bubbleKey = `${bubble.id}-${animationKey}`;
                      
                      return (
                        <div
                          key={bubbleKey}
                          ref={(el) => registerBubbleRef(bubbleKey, el)}
                          className={bubble.width === "full" ? "w-full" : ""}
                        >
                          <MessageBubble
                            animationKey={animationKey}
                            className={`${bubble.isUser ? USER_BUBBLE_COLOR : AI_BUBBLE_COLOR} rounded-xl ${
                              bubble.width === "full" ? "w-full" : ""
                            }`}
                            delay={delay}
                            isUser={bubble.isUser}
                            isVisible={isVisible}
                            style={{
                              height: bubble.height,
                              width: bubble.width === "full" ? undefined : bubble.width,
                            }}
                            onAnimationStart={() => scrollToLatestBubble(bubbleKey)}
                          />
                        </div>
                      );
                    } else {
                      // Grid 类型
                      const gridKey = `${bubble.id}-${animationKey}`;
                      const gridCells = bubble.cols * bubble.rows;
                      const startIndex = bubbleIndexInGroup; // 记录 grid 开始时的索引
                      
                      const gridContent = (
                        <div
                          key={gridKey}
                          ref={(el) => registerBubbleRef(gridKey, el)}
                          className={`grid gap-1.5 relative shrink-0 w-full`}
                          style={{
                            gridTemplateColumns: `repeat(${bubble.cols}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${bubble.rows}, minmax(0, 1fr))`,
                            height: bubble.height,
                          }}
                        >
                          {Array.from({ length: gridCells }).map((_, cellIndex) => {
                            const cellDelay = getBubbleDelay(group, startIndex + cellIndex);
                            return (
                              <MessageBubble
                                key={`${bubble.id}-cell-${cellIndex}-${animationKey}`}
                                animationKey={animationKey}
                                className={`${AI_BUBBLE_COLOR} rounded-xl h-full`}
                                delay={cellDelay}
                                isUser={false}
                                isVisible={isVisible}
                                onAnimationStart={cellIndex === 0 ? () => scrollToLatestBubble(gridKey) : undefined}
                              />
                            );
                          })}
                        </div>
                      );
                      
                      bubbleIndexInGroup += gridCells;
                      return gridContent;
                    }
                  })}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
