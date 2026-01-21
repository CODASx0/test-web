"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";


// 动画变体 - bubble 展开动画
const bubbleVariants = {
  hidden: {
    scaleX: 0.8,
    scaleY: 0.5,
    y: 6,
    opacity: 0,
  },
  visible: {
    scaleX: 1,
    scaleY: 1,
    y: 0,
    opacity: 1,
  },
};

// Bubble 组件
interface BubbleProps {
  className?: string;
  delay?: number;
  isUser?: boolean;
  style?: React.CSSProperties;
}

function Bubble({ className = "", delay = 0, isUser = false, style }: BubbleProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={bubbleVariants}
      transition={{
        // 为每个属性单独设置 delay，否则 delay 不生效
        scaleX: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay,
        },
        scaleY: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay,
        },
        y: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay,
        },
        opacity: {
          duration: 0,
          delay,
        },
      }}
      style={{
        transformOrigin: isUser ? "right center" : "left center",
        willChange: "transform, opacity",
        ...style,
      }}
    />
  );
}

// ========== 数据驱动的 Bubble 配置 ==========

// Message bubbles 配置 - 按顺序定义，index 自动计算 delay
interface MessageBubbleConfig {
  id: string;
  isUser: boolean;
  height: number | string;
  width: number | string;
  rounded?: string;
}

// Message 1 - User
const message1Bubbles: MessageBubbleConfig[] = [
  { id: "msg1-1", isUser: true, height: 33, width: "full" },
];

// Message 2 - AI
const message2Bubbles: MessageBubbleConfig[] = [
  { id: "msg2-1", isUser: false, height: 75, width: "full" },
];

// Message 3 - User
const message3Bubbles: MessageBubbleConfig[] = [
  { id: "msg3-1", isUser: true, height: 16, width: "full" },
];

// Message 4 - AI (多个 bubbles)
const message4Bubbles: MessageBubbleConfig[] = [
  { id: "msg4-1", isUser: false, height: 46, width: "full" },
  { id: "msg4-2", isUser: false, height: 12, width: 40 },
  { id: "msg4-3", isUser: false, height: 31, width: "full" },
  { id: "msg4-4", isUser: false, height: 12, width: 40 },
];

// Message 5 - AI Grid (只有第一行 3 个)
const message5Bubbles: MessageBubbleConfig[] = [
  { id: "msg5-1", isUser: false, height: "auto", width: "auto" },
  { id: "msg5-2", isUser: false, height: "auto", width: "auto" },
  { id: "msg5-3", isUser: false, height: "auto", width: "auto" },
];

// 合并所有 message bubbles 用于计算全局延迟
const allMessageBubbles = [
  ...message1Bubbles,
  ...message2Bubbles,
  ...message3Bubbles,
  ...message4Bubbles,
  ...message5Bubbles,
];

// Cmdbox bubbles 配置
interface CmdboxBubbleConfig {
  id: string;
  height: number;
  width: number | string;
  rounded?: string;
  isPrimary?: boolean; // 紫色主题色
}

const cmdboxBubbles: CmdboxBubbleConfig[] = [
  { id: "cmd1", height: 12, width: 90 },
  { id: "cmd2", height: 12, width: "flex-1" },
  { id: "cmd3", height: 12, width: 273 },
  { id: "cmd4", height: 24, width: 213, rounded: "full" },
  { id: "cmd5", height: 24, width: 90, rounded: "full", isPrimary: true },
];

// 动画延迟基础值
const DELAY_STEP = 0.1;

// 获取 bubble 在全局序列中的延迟
function getGlobalDelay(bubbleId: string): number {
  const index = allMessageBubbles.findIndex((b) => b.id === bubbleId);
  return index >= 0 ? index * DELAY_STEP : 0;
}

// 获取 cmdbox bubble 的延迟（在 message bubbles 之后）
function getCmdboxDelay(bubbleId: string): number {
  const baseDelay = allMessageBubbles.length * DELAY_STEP;
  const index = cmdboxBubbles.findIndex((b) => b.id === bubbleId);
  return baseDelay + (index >= 0 ? index * DELAY_STEP : 0);
}

// AI bubble 颜色 (Figma: rgba(74,68,89,0.08))
const AI_BUBBLE_COLOR = "bg-[rgba(74,68,89,0.08)]";
// User bubble 颜色 (Figma: rgba(134,61,251,0.16))
const USER_BUBBLE_COLOR = "bg-[rgba(134,61,251,0.16)]";

// 整句标题文本
const TITLE_FULL_TEXT = "create your first video with Medeo.";

export default function Dialog() {
  const titleVideoRef = useRef<HTMLVideoElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);
  const titleFadeStart = useRef<number | null>(null);

  useEffect(() => {
    const video = titleVideoRef.current;
    const canvas = titleCanvasRef.current;
    const text = titleTextRef.current;

    if (!video || !canvas || !text) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let rafId = 0;
    const tempCanvas = document.createElement("canvas");
    const maskCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    const drawFrame = () => {
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
          tempCtx.filter = "blur(25px)";
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
    };
  }, []);

  return (
    <div
      className="bg-white flex flex-col isolate items-end overflow-clip relative rounded-[24px] w-[728px] h-[560px]"
      data-name="Dialog"
    >
      {/* Header - Title */}
      <div className="flex gap-2 items-center pb-7 pt-8 px-8 relative shrink-0 w-full z-3">
        <div className="flex flex-1 gap-1.5 items-center justify-center relative">
          <div className="relative shrink-0 h-8 flex items-center">
            {/* 单一文本层：未就绪时显示黑色，就绪后渐变显现 */}
            <span
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
        <div className="bg-[#e4e4e7] flex flex-col gap-[0.5px] h-[360px] items-start overflow-clip p-[0.5px] relative shrink-0 w-[677px] rounded-[16px]">
          {/* Layer blur effect */}
          <div className="absolute blur-[100px] -top-[16%] -right-[7%] -bottom-[7%] left-[78%] overflow-hidden">
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
          <div className="flex flex-1 flex-col gap-[0.5px] items-start overflow-hidden relative  w-full rounded-[15.5px] ">
            {/* Top bar */}
            <div className="bg-white h-6 shrink-0 w-full" />
            
            {/* Main content grid */}
            <div className="flex flex-1 gap-[0.5px] items-start relative w-full">
              {/* Left panel */}
              <div className="flex flex-1 flex-col gap-[0.5px] h-full items-start relative">
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
              <div className="bg-[#fafafa] flex flex-col gap-2.5 h-full items-start overflow-clip p-2.5 relative shrink-0 w-[200px]">
                {/* Message 1 - User */}
                <div className="flex flex-col items-end pl-12 relative shrink-0 w-full">
                  {message1Bubbles.map((bubble) => (
                    <Bubble
                      key={bubble.id}
                      className={`${USER_BUBBLE_COLOR} rounded-[4px] w-full`}
                      delay={getGlobalDelay(bubble.id)}
                      isUser={bubble.isUser}
                      style={{ height: typeof bubble.height === 'number' ? `${bubble.height}px` : bubble.height }}
                    />
                  ))}
                </div>

                {/* Message 2 - AI */}
                <div className="flex flex-col items-start pr-12 relative shrink-0 w-full">
                  {message2Bubbles.map((bubble) => (
                    <Bubble
                      key={bubble.id}
                      className={`${AI_BUBBLE_COLOR} rounded-[4px] w-full`}
                      delay={getGlobalDelay(bubble.id)}
                      isUser={bubble.isUser}
                      style={{ height: typeof bubble.height === 'number' ? `${bubble.height}px` : bubble.height }}
                    />
                  ))}
                </div>

                {/* Message 3 - User */}
                <div className="flex flex-col items-end pl-12 relative shrink-0 w-full">
                  {message3Bubbles.map((bubble) => (
                    <Bubble
                      key={bubble.id}
                      className={`${USER_BUBBLE_COLOR} rounded-[4px] w-full`}
                      delay={getGlobalDelay(bubble.id)}
                      isUser={bubble.isUser}
                      style={{ height: typeof bubble.height === 'number' ? `${bubble.height}px` : bubble.height }}
                    />
                  ))}
                </div>

                {/* Message 4 - AI (multiple bubbles) */}
                <div className="flex flex-col gap-1.5 items-start pr-12 relative shrink-0 w-full">
                  {message4Bubbles.map((bubble) => (
                    <Bubble
                      key={bubble.id}
                      className={`${AI_BUBBLE_COLOR} rounded-[4px] ${bubble.width === "full" ? "w-full" : ""}`}
                      delay={getGlobalDelay(bubble.id)}
                      isUser={bubble.isUser}
                      style={{ 
                        height: typeof bubble.height === 'number' ? `${bubble.height}px` : bubble.height,
                        width: bubble.width === "full" ? "100%" : typeof bubble.width === 'number' ? `${bubble.width}px` : bubble.width,
                      }}
                    />
                  ))}
                </div>

                {/* Message 5 - AI Grid */}
                <div className="grid grid-cols-3 grid-rows-1 gap-1.5 h-[57px] relative shrink-0 w-full">
                  {message5Bubbles.map((bubble) => (
                    <Bubble
                      key={bubble.id}
                      className={`${AI_BUBBLE_COLOR} rounded-[4px]`}
                      delay={getGlobalDelay(bubble.id)}
                      isUser={bubble.isUser}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Command Box */}
        <div
          className="absolute bg-white border border-[#e4e4e7]/50 flex flex-col gap-2.5 h-[105px] items-start left-4 p-3.5 rounded-[20px] top-[272.5px] w-[523px]"
        >
          <div className="flex flex-col gap-2.5 items-start relative shrink-0 w-full">
            {/* 第一行：两个 bubbles */}
            <div className="flex gap-2.5 items-start relative shrink-0 w-full">
              <Bubble
                className={`${AI_BUBBLE_COLOR} h-3 rounded-[4px] w-[90px]`}
                delay={getCmdboxDelay("cmd1")}
                isUser={false}
              />
              <Bubble
                className={`${AI_BUBBLE_COLOR} flex-1 h-3 rounded-[4px]`}
                delay={getCmdboxDelay("cmd2")}
                isUser={false}
              />
            </div>
            {/* 第二行 */}
            <Bubble
              className={`${AI_BUBBLE_COLOR} h-3 rounded-[4px] w-[273px]`}
              delay={getCmdboxDelay("cmd3")}
              isUser={false}
            />
          </div>
          {/* 底部行 */}
          <div className="flex flex-1 items-end justify-between relative w-full">
            <Bubble
              className={`${AI_BUBBLE_COLOR} h-6 rounded-full w-[213px]`}
              delay={getCmdboxDelay("cmd4")}
              isUser={false}
            />
            <Bubble
              className={`${USER_BUBBLE_COLOR} h-6 rounded-full w-[90px]`}
              delay={getCmdboxDelay("cmd5")}
              isUser={false}
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
        <div className="bg-[#09090b] border border-[rgba(9,9,11,0.12)]/50 flex flex-col h-10 items-center justify-center overflow-clip relative rounded-xl shrink-0 cursor-pointer hover:opacity-90 transition-opacity duration-200">
          <div className="flex gap-1 items-center justify-center pl-6 pr-4 py-3 relative shrink-0 w-full">
            <div
              className="flex flex-col font-medium justify-center relative shrink-0 text-white text-sm text-center tracking-[0.1px]"
              style={{ 
                fontFamily: "var(--font-manrope)",
                fontFeatureSettings: "'zero'" 
              }}
            >
              <p className="leading-5">Start Now</p>
            </div>
            <div className="flex items-center relative shrink-0">
              <div className="relative shrink-0 size-3.5">
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
              </div>
            </div>
          </div>
          {/* Button inner shadow */}
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.2),inset_0px_5px_10px_0px_rgba(255,255,255,0.25)]" />
        </div>
      </div>
    </div>
  );
}
