"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

// 动画曲线 - 根据 animation-rules.mdc
const EASE_IN_CUBIC = [0.55, 0.055, 0.675, 0.19] as const;
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

// 动画时间配置
const ANIMATION_CONFIG = {
  inputBubbleDelay: 0.1, // 每个 input bubble 之间的延迟
  inputBubbleDuration: 0.3, // input bubble 宽度伸展动画时长
  generatePressDuration: 0.25, // generate 按钮按下动画时长
  generatePressScale: 0.8, // generate 按钮按下缩放比例
  inputMoveUpDuration: 0.4, // input 框向上移动动画时长
  inputMoveUpDistance: -60, // input 向上移动距离
  bubbleStartDelay: 0.35, // generate 点击后到 bubble 开始入场的延迟
  messageHoldDuration: 0.8, // message-group 入场完成后的停留时间
  messageExitDuration: 0.4, // message-group 出场动画时长
  messageExitDistance: -30, // message-group 出场位移
  loopDelay: 0.3, // message-group 出场后的等待时间
};

// 静态 Bubble 组件 - 无动画（用于 toolbar）
interface StaticBubbleProps {
  className?: string;
  style?: React.CSSProperties;
}

function StaticBubble({ className = "", style }: StaticBubbleProps) {
  return <div className={className} style={style} />;
}

// Input Bubble 组件 - 宽度伸展动画
interface InputBubbleProps {
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
  animationKey: number;
  isVisible?: boolean; // 控制是否可见
}

function InputBubble({ className = "", delay = 0, style, animationKey, isVisible = true }: InputBubbleProps) {
  return (
    <motion.div
      key={animationKey}
      className={className}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={isVisible ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
      transition={{
        scaleX: {
          duration: isVisible ? ANIMATION_CONFIG.inputBubbleDuration : 0, // 隐藏时无过渡
          ease: EASE_OUT_CUBIC,
          delay: isVisible ? delay : 0,
        },
        opacity: {
          duration: isVisible ? 0.1 : 0,
          delay: isVisible ? delay : 0,
        },
      }}
      style={{
        transformOrigin: "left center",
        ...style,
      }}
    />
  );
}

// Message Bubble 组件 - 从左/右侧 + 从下往上入场动画
interface MessageBubbleProps {
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  isUser?: boolean; // 用户消息从右侧入场，AI 消息从左侧入场
  animationKey: number;
  isVisible?: boolean; // 控制是否可见（动画开始）
}

function MessageBubble({ className = "", style, delay = 0, isUser = false, animationKey, isVisible = true }: MessageBubbleProps) {
  return (
    <motion.div
      key={animationKey}
      className={className}
      initial={{ scaleX: 0, y: 20, opacity: 0 }}
      animate={isVisible ? { scaleX: 1, y: 0, opacity: 1 } : { scaleX: 0, y: 20, opacity: 0 }}
      transition={{
        scaleX: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay: isVisible ? delay : 0,
        },
        y: {
          type: "spring",
          stiffness: 400,
          damping: 30,
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

// 尺寸值转换工具函数
function formatSize(value: number | string): string {
  if (typeof value === "number") return `${value}px`;
  if (value === "full") return "100%";
  return value;
}

// MessageGroup 组件 - 减少重复代码
interface MessageGroupProps {
  bubbles: MessageBubbleConfigType[];
  isUserMessage: boolean;
  baseDelay: number; // 该组 bubble 入场的基础延迟
  animationKey: number;
  isVisible?: boolean; // 控制 bubbles 是否可见
}

function MessageGroup({ bubbles, isUserMessage, baseDelay, animationKey, isVisible = true }: MessageGroupProps) {
  const bubbleColor = isUserMessage ? USER_BUBBLE_COLOR : AI_BUBBLE_COLOR;
  const containerClass = isUserMessage
    ? "flex flex-col items-end pl-12 relative shrink-0 w-full"
    : "flex flex-col items-start pr-12 relative shrink-0 w-full";

  return (
    <div className={containerClass}>
      {bubbles.map((bubble, index) => (
        <MessageBubble
          key={`${bubble.id}-${animationKey}`}
          animationKey={animationKey}
          className={`${bubbleColor} rounded-[4px] ${bubble.width === "full" ? "w-full" : ""}`}
          delay={baseDelay + index * 0.08}
          isUser={isUserMessage}
          isVisible={isVisible}
          style={{
            height: formatSize(bubble.height),
            width: bubble.width === "full" ? undefined : formatSize(bubble.width),
          }}
        />
      ))}
    </div>
  );
}

// ========== 数据驱动的 Bubble 配置 ==========

// Message bubbles 配置 - 按顺序定义
interface MessageBubbleConfigType {
  id: string;
  isUser: boolean;
  height: number | string;
  width: number | string;
  rounded?: string;
}

// Message 1 - User
const message1Bubbles: MessageBubbleConfigType[] = [
  { id: "msg1-1", isUser: true, height: 33, width: "full" },
];

// Message 2 - AI
const message2Bubbles: MessageBubbleConfigType[] = [
  { id: "msg2-1", isUser: false, height: 75, width: "full" },
];

// Message 3 - User
const message3Bubbles: MessageBubbleConfigType[] = [
  { id: "msg3-1", isUser: true, height: 16, width: "full" },
];

// Message 4 - AI (多个 bubbles)
const message4Bubbles: MessageBubbleConfigType[] = [
  { id: "msg4-1", isUser: false, height: 46, width: "full" },
  { id: "msg4-2", isUser: false, height: 12, width: 40 },
  { id: "msg4-3", isUser: false, height: 31, width: "full" },
  { id: "msg4-4", isUser: false, height: 12, width: 40 },
];

// Message 5 - AI Grid (只有第一行 3 个)
const message5Bubbles: MessageBubbleConfigType[] = [
  { id: "msg5-1", isUser: false, height: "auto", width: "auto" },
  { id: "msg5-2", isUser: false, height: "auto", width: "auto" },
  { id: "msg5-3", isUser: false, height: "auto", width: "auto" },
];

// Input 区域的 bubbles 配置（Figma 中的 cmdbox > input）
interface InputBubbleConfig {
  id: string;
  height: number;
  width: number | string;
}

const inputBubbles: InputBubbleConfig[] = [
  { id: "input1", height: 12, width: "full" },
  { id: "input2", height: 12, width: 406 },
];

// Toolbar 的配置（常驻，无动画）
interface ToolbarItemConfig {
  id: string;
  height: number;
  width: number;
  rounded: string;
  isPrimary?: boolean;
}

const toolbarItems: ToolbarItemConfig[] = [
  { id: "tool", height: 24, width: 213, rounded: "full" },
  { id: "generate", height: 24, width: 90, rounded: "full", isPrimary: true },
];

// AI bubble 颜色 (Figma: rgba(74,68,89,0.08))
const AI_BUBBLE_COLOR = "bg-[rgba(74,68,89,0.08)]";
// User bubble 颜色 (Figma: rgba(134,61,251,0.16))
const USER_BUBBLE_COLOR = "bg-[rgba(134,61,251,0.16)]";

// 整句标题文本
const TITLE_FULL_TEXT = "create your first video with Medeo.";

// 动画阶段枚举
enum AnimationPhase {
  INPUT_EXPAND = 0,      // Phase 1: Input bubbles 宽度伸展
  GENERATE_PRESS = 1,    // Phase 2: Generate 按钮弹簧按压
  INPUT_UP_MSG_ENTER = 2,// Phase 3: Input 向上 + Message-group 入场（bubbles 逐条从左右入场）
  MESSAGE_EXIT = 3,      // Phase 4: Message-group 出场
  RESET = 4,             // Phase 5: 重置（input instant 归位）
}

export default function Dialog() {
  const titleVideoRef = useRef<HTMLVideoElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);
  const titleFadeStart = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  // 动画状态
  const [animationKey, setAnimationKey] = useState(0);
  const [phase, setPhase] = useState<AnimationPhase>(AnimationPhase.INPUT_EXPAND);
  const [generateScale, setGenerateScale] = useState(1);
  const [inputY, setInputY] = useState(0);
  const [inputTransition, setInputTransition] = useState(true); // 控制 input 是否有过渡动画
  const [showInputBubbles, setShowInputBubbles] = useState(true); // 控制 input bubbles 是否可见
  const [messageGroupY, setMessageGroupY] = useState(0); // message-group 位置（只在出场时变化）
  const [messageGroupOpacity, setMessageGroupOpacity] = useState(1); // message-group 透明度（只在出场时变化）
  const [showBubbles, setShowBubbles] = useState(false); // 控制 message bubbles 是否开始入场动画

  // 计算动画时间
  const inputExpandDuration = inputBubbles.length * ANIMATION_CONFIG.inputBubbleDelay + ANIMATION_CONFIG.inputBubbleDuration;
  // 计算所有 bubble 入场动画的总时长
  const allBubblesCount = message1Bubbles.length + message2Bubbles.length + message3Bubbles.length + message4Bubbles.length + message5Bubbles.length;
  const bubbleEntranceDuration = allBubblesCount * 0.08 + 0.3; // 最后一个 bubble 的延迟 + spring 动画时间

  // 动画序列控制
  const runAnimationSequence = useCallback(() => {
    // 重置状态 - 先隐藏 input bubbles（instant，宽度变0）
    setShowInputBubbles(false);
    setInputTransition(false);
    setShowBubbles(false); // 隐藏 message bubbles

    // 下一帧再重置位置，确保宽度已经是0
    requestAnimationFrame(() => {
      setPhase(AnimationPhase.INPUT_EXPAND);
      setGenerateScale(1);
      setInputY(0);
      setMessageGroupY(0);
      setMessageGroupOpacity(1);

      // 再下一帧恢复过渡并显示 input bubbles
      requestAnimationFrame(() => {
        setInputTransition(true);
        setShowInputBubbles(true); // 显示 input bubbles，触发入场动画
      });
    });

    // Phase 1: Input bubbles 宽度伸展动画
    // 动画由 InputBubble 组件自动处理

    // Phase 2: Generate 按钮弹簧按压 (在 input 动画完成后)
    const phase2Timeout = setTimeout(() => {
      setPhase(AnimationPhase.GENERATE_PRESS);
      setGenerateScale(ANIMATION_CONFIG.generatePressScale);

      // 按钮回弹
      setTimeout(() => {
        setGenerateScale(1);
      }, ANIMATION_CONFIG.generatePressDuration * 1000 / 2);
    }, inputExpandDuration * 1000);

    // Phase 3a: Generate 点击后立即，Input 向上 100px
    const phase3aTimeout = setTimeout(() => {
      setPhase(AnimationPhase.INPUT_UP_MSG_ENTER);
      setInputY(ANIMATION_CONFIG.inputMoveUpDistance); // input 向上 100px
    }, (inputExpandDuration + ANIMATION_CONFIG.generatePressDuration) * 1000);

    // Phase 3b: Generate 点击后 0.3s，Bubbles 从左右入场
    const phase3bTimeout = setTimeout(() => {
      setShowBubbles(true); // 触发 bubbles 从左右两侧逐条入场
    }, (inputExpandDuration + ANIMATION_CONFIG.generatePressDuration + ANIMATION_CONFIG.bubbleStartDelay) * 1000);

    // Phase 4: Message-group 出场 (bubbles 入场动画完成后 + 停留时间)
    const phase4Timeout = setTimeout(() => {
      setPhase(AnimationPhase.MESSAGE_EXIT);
      setMessageGroupY(ANIMATION_CONFIG.messageExitDistance); // 向上移动 100px
      setMessageGroupOpacity(0); // 淡出
    }, (inputExpandDuration + ANIMATION_CONFIG.generatePressDuration + ANIMATION_CONFIG.bubbleStartDelay + bubbleEntranceDuration + ANIMATION_CONFIG.messageHoldDuration) * 1000);

    // Phase 5: 重置 - 循环 (message-group 出场完成后 + loopDelay)
    const loopTimeout = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
    }, (inputExpandDuration + ANIMATION_CONFIG.generatePressDuration + ANIMATION_CONFIG.bubbleStartDelay + bubbleEntranceDuration + ANIMATION_CONFIG.messageHoldDuration + ANIMATION_CONFIG.messageExitDuration + ANIMATION_CONFIG.loopDelay) * 1000);

    return () => {
      clearTimeout(phase2Timeout);
      clearTimeout(phase3aTimeout);
      clearTimeout(phase3bTimeout);
      clearTimeout(phase4Timeout);
      clearTimeout(loopTimeout);
    };
  }, [inputExpandDuration, bubbleEntranceDuration]);

  // 启动动画循环
  useEffect(() => {
    const cleanup = runAnimationSequence();
    return cleanup;
  }, [animationKey, runAnimationSequence]);

  // 计算 message bubble 入场的累积延迟
  const BUBBLE_DELAY_STEP = 0.08;
  const messageBubbleCounts = [
    message1Bubbles.length, // group 0
    message2Bubbles.length, // group 1
    message3Bubbles.length, // group 2
    message4Bubbles.length, // group 3
    message5Bubbles.length, // group 4
  ];

  const getMessageBubbleDelay = (groupIndex: number) => {
    let totalBubbles = 0;
    for (let i = 0; i < groupIndex; i++) {
      totalBubbles += messageBubbleCounts[i];
    }
    return totalBubbles * BUBBLE_DELAY_STEP;
  };

  useEffect(() => {
    const video = titleVideoRef.current;
    const canvas = titleCanvasRef.current;
    const text = titleTextRef.current;

    if (!video || !canvas || !text) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const tempCanvas = document.createElement("canvas");
    const maskCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    // 节流：限制为约 30fps 以减少 toDataURL 调用
    const FRAME_INTERVAL = 1000 / 30;

    const drawFrame = (timestamp: number) => {
      // 节流检查
      if (timestamp - lastFrameTime.current < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      lastFrameTime.current = timestamp;

      if (video.readyState >= 2) {
        const rect = text.getBoundingClientRect();
        const w = Math.ceil(rect.width) || 403;
        const h = Math.ceil(rect.height) || 32;

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        if (tempCanvas.width !== w || tempCanvas.height !== h) {
          tempCanvas.width = w;
          tempCanvas.height = h;
        }
        if (maskCanvas.width !== w || maskCanvas.height !== h) {
          maskCanvas.width = w;
          maskCanvas.height = h;
        }

        if (!titleFadeStart.current) {
          titleFadeStart.current = performance.now();
        }

        const elapsed = performance.now() - (titleFadeStart.current || 0);
        const fadeProgress = Math.min(elapsed / 500, 1);

        // 1. 先填充纯黑色背景（文字基础色）
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, w, h);

        if (tempCtx && maskCtx) {
          // 2. 绘制模糊视频帧到临时 canvas
          tempCtx.clearRect(0, 0, w, h);
          tempCtx.filter = "blur(20px)"; // 降低到 20px，符合动画规则（不超过 20px）
          // 视频绘制位置偏移，让彩色部分出现在右侧
          tempCtx.drawImage(video, w * 0.3, -h * 2, w * 1.5, h * 5);
          tempCtx.filter = "none";

          // 3. 创建从左到右的渐变遮罩（左边透明，右边不透明）
          maskCtx.clearRect(0, 0, w, h);
          const gradient = maskCtx.createLinearGradient(0, 0, w, 0);
          gradient.addColorStop(0, "rgba(0,0,0,0)");
          gradient.addColorStop(0.55, "rgba(0,0,0,0)");
          gradient.addColorStop(0.75, "rgba(0,0,0,1)");
          gradient.addColorStop(1, "rgba(0,0,0,1)");
          maskCtx.fillStyle = gradient;
          maskCtx.fillRect(0, 0, w, h);

          // 4. 将遮罩应用到彩色视频
          tempCtx.globalCompositeOperation = "destination-in";
          tempCtx.drawImage(maskCanvas, 0, 0);
          tempCtx.globalCompositeOperation = "source-over";

          // 5. 渐变淡入：将彩色视频以 alpha 叠加到黑色背景上
          ctx.save();
          ctx.globalAlpha = fadeProgress;
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.restore();
        }

        const dataUrl = canvas.toDataURL("image/png");
        text.style.backgroundImage = `url("${dataUrl}")`;
        text.style.backgroundSize = `${w}px ${h}px`;
        text.style.backgroundPosition = "0 0";
        text.style.backgroundRepeat = "no-repeat";
      }
      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      // 清理临时 canvas
      tempCanvas.width = 0;
      tempCanvas.height = 0;
      maskCanvas.width = 0;
      maskCanvas.height = 0;
    };
  }, []);

  return (
    <div
      className="bg-white flex flex-col isolate items-end overflow-clip relative rounded-[24px] w-[728px] h-[560px]"
      data-name="Dialog"
      role="dialog"
      aria-labelledby="dialog-title"
    >
      {/* Header - Title */}
      <div className="flex gap-2 items-center pb-7 pt-8 px-8 relative shrink-0 w-full z-3">
        <div className="flex flex-1 gap-1.5 items-center justify-center relative">
          <div className="relative shrink-0 h-8 flex items-center">
            {/* 单一文本层：未就绪时显示黑色，就绪后渐变显现 */}
            <span
              id="dialog-title"
              ref={titleTextRef}
              className="font-semibold text-2xl whitespace-nowrap"
              style={{
                fontFamily: "var(--font-nohemi)",
                fontFeatureSettings: "'zero'",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                backgroundColor: "#09090b",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                willChange: "background-image",
              }}
            >
              Let&apos;s {TITLE_FULL_TEXT}
            </span>
            <video
              ref={titleVideoRef}
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              className="absolute inset-0 opacity-0 pointer-events-none"
            >
              <source src="/layer.mp4" type="video/mp4" />
            </video>
            <canvas
              ref={titleCanvasRef}
              className="absolute inset-0 opacity-0 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="bg-gradient-to-b from-white to-[#fafafa] border-b border-[#e4e4e7]/50 flex flex-1 gap-2 items-start justify-end overflow-clip px-[18px] py-0 relative w-full z-2"
      >
        {/* Main Container */}
        <div className="bg-[#e4e4e7] flex flex-col gap-[0.5px] h-[360px] items-stretch overflow-clip p-[0.5px] relative shrink-0 w-[677px] rounded-[16px]">
          {/* Layer blur effect - decorative only */}
          <div className="absolute blur-[20px] -top-[16%] -right-[7%] -bottom-[7%] left-[78%] overflow-hidden" aria-hidden="true">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/layer.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Inner container */}
          <div className="flex flex-1 flex-col gap-[0.5px] items-stretch overflow-hidden relative  w-full rounded-[15.5px] ">
            {/* Top bar */}
            <div className="bg-white h-6 shrink-0 w-full" />

            {/* Main content grid */}
            <div className="flex h-[calc(100%-24px-0.5px)] gap-[0.5px] items-stretch relative w-full">
              {/* Left panel */}
              <div className="flex flex-1 flex-col gap-[0.5px] items-start relative">
                {/* Top row */}
                <div className="flex flex-1 gap-[0.5px] items-center relative w-full">
                  <div className="bg-white flex flex-col h-full items-start overflow-clip pb-6 pt-2.5 px-2.5 shrink-0 w-[100px]" />
                  <div className="bg-white flex flex-col gap-2.5 h-full items-start overflow-clip pb-6 pt-2.5 px-2.5 shrink-0 w-[100px]" />
                  <div className="bg-white flex flex-1 h-full items-start overflow-clip pb-6 pt-2.5 px-2.5" />
                </div>
                {/* Bottom row */}
                <div className="bg-white flex h-[125px] items-start overflow-clip pb-6 pt-2.5 px-2.5 shrink-0 w-full" />
              </div>

              {/* Message container - Right panel */}
              <div className="bg-[#fafafa] flex flex-col h-full items-start overflow-clip p-2.5 relative shrink-0 w-[200px]">
                {/* Message Group - 只有出场动画（位移+淡出），入场动画由 bubbles 自己控制 */}
                <motion.div
                  className="flex flex-col gap-2.5 items-start relative shrink-0 w-full"
                  data-name="message-group"
                  animate={{
                    y: messageGroupY,
                    opacity: messageGroupOpacity,
                  }}
                  transition={{
                    y: {
                      duration: phase === AnimationPhase.MESSAGE_EXIT ? ANIMATION_CONFIG.messageExitDuration : 0,
                      ease: EASE_IN_CUBIC,
                    },
                    opacity: {
                      duration: phase === AnimationPhase.MESSAGE_EXIT ? ANIMATION_CONFIG.messageExitDuration : 0,
                      ease: EASE_IN_CUBIC,
                    },
                  }}
                >
                  {/* Message 1 - User */}
                  <MessageGroup
                    bubbles={message1Bubbles}
                    isUserMessage={true}
                    baseDelay={getMessageBubbleDelay(0)}
                    animationKey={animationKey}
                    isVisible={showBubbles}
                  />

                  {/* Message 2 - AI */}
                  <MessageGroup
                    bubbles={message2Bubbles}
                    isUserMessage={false}
                    baseDelay={getMessageBubbleDelay(1)}
                    animationKey={animationKey}
                    isVisible={showBubbles}
                  />

                  {/* Message 3 - User */}
                  <MessageGroup
                    bubbles={message3Bubbles}
                    isUserMessage={true}
                    baseDelay={getMessageBubbleDelay(2)}
                    animationKey={animationKey}
                    isVisible={showBubbles}
                  />

                  {/* Message 4 - AI (multiple bubbles) */}
                  <div className="flex flex-col gap-1.5 items-start pr-12 relative shrink-0 w-full">
                    {message4Bubbles.map((bubble, index) => (
                      <MessageBubble
                        key={`${bubble.id}-${animationKey}`}
                        animationKey={animationKey}
                        className={`${AI_BUBBLE_COLOR} rounded-[4px] ${bubble.width === "full" ? "w-full" : ""}`}
                        delay={getMessageBubbleDelay(3) + index * 0.08}
                        isUser={false}
                        isVisible={showBubbles}
                        style={{
                          height: formatSize(bubble.height),
                          width: bubble.width === "full" ? undefined : formatSize(bubble.width),
                        }}
                      />
                    ))}
                  </div>

                  {/* Message 5 - AI Grid */}
                  <div className="grid grid-cols-3 grid-rows-1 gap-1.5 h-[57px] relative shrink-0 w-full">
                    {message5Bubbles.map((bubble, index) => (
                      <MessageBubble
                        key={`${bubble.id}-${animationKey}`}
                        animationKey={animationKey}
                        className={`${AI_BUBBLE_COLOR} rounded-[4px]`}
                        delay={getMessageBubbleDelay(4) + index * 0.08}
                        isUser={false}
                        isVisible={showBubbles}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Command Box - 不移动 */}
        <div
          className="absolute bg-white border border-[#e4e4e7]/50 flex flex-col gap-2.5 h-[105px] items-start left-4 p-3.5 rounded-[20px] top-[272.5px] w-[523px] overflow-clip"
          data-name="cmdbox"
        >
          {/* Input 区域 - 带宽度伸展动画 + 向上移动动画 */}
          <motion.div
            className="flex flex-col gap-2.5 items-start relative shrink-0 w-full"
            data-name="input"
            animate={{ y: inputY }}
            transition={{
              duration: inputTransition ? ANIMATION_CONFIG.inputMoveUpDuration : 0, // instant 重置时无过渡
              ease: EASE_IN_CUBIC,
            }}
          >
            {inputBubbles.map((bubble, index) => (
              <InputBubble
                key={`${bubble.id}-${animationKey}`}
                animationKey={animationKey}
                className={`${AI_BUBBLE_COLOR} rounded-[4px]`}
                delay={index * ANIMATION_CONFIG.inputBubbleDelay}
                isVisible={showInputBubbles}
                style={{
                  height: formatSize(bubble.height),
                  width: bubble.width === "full" ? "100%" : formatSize(bubble.width),
                }}
              />
            ))}
          </motion.div>

          {/* Toolbar 区域 - 常驻，无入场动画 */}
          <div className="flex flex-1 items-end justify-between relative w-full" data-name="tool-bar">
            {/* Tool */}
            <StaticBubble
              className="border-[0.5px] border-[#e4e4e7] h-6 rounded-full w-[213px]"
            />
            {/* Generate 按钮 - 带弹簧按压效果 */}
            <motion.div
              className={`${USER_BUBBLE_COLOR} h-6 rounded-full w-[90px]`}
              animate={{ scale: generateScale }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
              }}
              style={{ transformOrigin: "center center" }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white flex gap-4 items-center p-4 relative shrink-0 w-full z-1">
        <div
          className="flex flex-1 font-medium gap-3 items-center leading-5 px-4 relative text-[#09090b] text-sm tracking-[0.2px]"
          style={{
            fontFamily: "var(--font-manrope)",
            fontFeatureSettings: "'zero'"
          }}
        >
          <p className="relative shrink-0">Take 2~3 minutes to edit with Medeo.</p>
          <p className="opacity-50 relative shrink-0">No credit consumption required.</p>
        </div>

        {/* Start Now Button */}
        <button
          type="button"
          aria-label="Start Now"
          className="bg-[#09090b] border border-[rgba(9,9,11,0.12)]/50 flex flex-col h-10 items-center justify-center overflow-clip relative rounded-xl shrink-0 cursor-pointer transition-opacity duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
        >
          <div className="flex gap-1 items-center justify-center pl-6 pr-4 py-3 relative shrink-0 w-full">
            <span
              className="flex flex-col font-medium justify-center relative shrink-0 text-white text-sm text-center tracking-[0.1px] leading-5"
              style={{
                fontFamily: "var(--font-manrope)",
                fontFeatureSettings: "'zero'"
              }}
            >
              Start Now
            </span>
            <span className="flex items-center relative shrink-0" aria-hidden="true">
              <span className="relative shrink-0 size-3.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-full"
                >
                  <path
                    d="M5.25 3.5L8.75 7L5.25 10.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
          </div>
          {/* Button inner shadow */}
          <span className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.2),inset_0px_5px_10px_0px_rgba(255,255,255,0.25)]" />
        </button>
      </div>
    </div>
  );
}
