"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Box,
  RectangleHorizontal,
  Ellipsis,
} from "lucide-react";

// 动画曲线 - 根据动画设计规范
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

// Play 图标 - 保持原始设计
function PlayIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 4.5L13.5 9L6.75 13.5V4.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 工具栏按钮组件
interface ToolButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}

function ToolButton({ icon, label, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 h-10 px-3 py-2.5 rounded-full text-[#3f3f46] transition-colors duration-150 ease [@media(hover:hover)_and_(pointer:fine)]:hover:bg-black/5"
    >
      <span className="size-[18px] flex items-center justify-center">
        {icon}
      </span>
      {label && (
        <span
          className="text-sm font-medium tracking-[0.1px] leading-5"
          style={{
            fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            fontFeatureSettings: "'zero'",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

// 提示文字组件 - 使用 canvas + video 实现文字遮罩效果（参考 dialog.tsx 标题实现）
function HintText() {
  const hintVideoRef = useRef<HTMLVideoElement | null>(null);
  const hintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hintTextRef = useRef<HTMLSpanElement | null>(null);
  const hintFadeStart = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  useEffect(() => {
    const video = hintVideoRef.current;
    const canvas = hintCanvasRef.current;
    const text = hintTextRef.current;

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
        const w = Math.ceil(rect.width) || 288;
        const h = Math.ceil(rect.height) || 20;

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

        if (!hintFadeStart.current) {
          hintFadeStart.current = performance.now();
        }

        const elapsed = performance.now() - (hintFadeStart.current || 0);
        const fadeProgress = Math.min(elapsed / 500, 1);

        // 1. 先填充纯黑色背景（文字基础色）
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, w, h);

        if (tempCtx && maskCtx) {
          // 2. 绘制模糊视频帧到临时 canvas
          tempCtx.clearRect(0, 0, w, h);
          tempCtx.filter = "blur(20px)";
          // 视频绘制位置偏移，让彩色部分出现在右侧
          tempCtx.drawImage(video, w * 0.3, -h * 2, w * 1.5, h * 5);
          tempCtx.filter = "none";

          // 3. 创建从左到右的渐变遮罩（左边透明，右边不透明）
          // "Press Generate " 大约占 45%，"After entering your prompt." 占 55%
          maskCtx.clearRect(0, 0, w, h);
          const gradient = maskCtx.createLinearGradient(0, 0, w, 0);
          gradient.addColorStop(0, "rgba(0,0,0,0)");
          gradient.addColorStop(0.42, "rgba(0,0,0,0)");
          gradient.addColorStop(0.58, "rgba(0,0,0,1)");
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
    <div className="relative flex items-center">
      <span
        ref={hintTextRef}
        className="text-sm font-medium tracking-[0.1px] leading-5 whitespace-nowrap"
        style={{
          fontFamily: "var(--font-manrope, Manrope, sans-serif)",
          fontFeatureSettings: "'zero'",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          backgroundColor: "#09090b",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          willChange: "background-image",
        }}
      >
        Press Generate After entering your prompt.
      </span>
      <video
        ref={hintVideoRef}
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
        ref={hintCanvasRef}
        className="absolute inset-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}

// 内部 CommandBox 容器的固定尺寸
const CMDBOX_WIDTH = 956;
const CMDBOX_HEIGHT = 165;
const CMDBOX_BORDER_RADIUS = 32;

// 打字机效果的目标文字
const TYPEWRITER_TEXT = "Show me some good movie shots in 30s.";
const TYPEWRITER_SPEED = 15; // 每个字符的间隔时间 (ms)
const TYPEWRITER_DELAY = 300; // 展开动画后的延迟 (ms)

interface CmdboxForOnboardingProps {
  isExpanded: boolean;
  onGenerate?: () => void; // Generate 按钮点击回调
}

export default function CmdboxForOnboarding({ isExpanded, onGenerate }: CmdboxForOnboardingProps) {
  const [displayText, setDisplayText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  // 自动调整文本区域高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
  }, [displayText]);

  // 打字机动画 - 当 isExpanded 变为 true 时触发
  useEffect(() => {
    // 清理之前的定时器
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];

    // 如果不展开，重置文本并退出
    if (!isExpanded) {
      setDisplayText("");
      return;
    }

    // 重置文本
    setDisplayText("");

    // 如果用户偏好减少动画，直接显示全部文字
    if (shouldReduceMotion) {
      setDisplayText(TYPEWRITER_TEXT);
      return;
    }

    // 逐字显示
    for (let i = 0; i < TYPEWRITER_TEXT.length; i++) {
      const timeoutId = setTimeout(() => {
        setDisplayText(TYPEWRITER_TEXT.slice(0, i + 1));
      }, TYPEWRITER_DELAY + i * TYPEWRITER_SPEED);
      timeoutIdsRef.current.push(timeoutId);
    }

    // 清理函数
    return () => {
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, [isExpanded, shouldReduceMotion]);

  return (
    // 外层容器 - 动画展开 padding 和圆角
    <motion.div
      className={`relative bg-[#f4f4f5] flex flex-col items-center transition-[gap] duration-400 ${isExpanded ? "gap-2.5" : "gap-0"}`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.215, 0.61, 0.355, 1)",
      }}
      initial={{
        padding: 0,
        paddingBottom: 0,
        borderRadius: CMDBOX_BORDER_RADIUS,
      }}
      animate={{
        padding: isExpanded ? 8 : 0,
        paddingBottom: isExpanded ? 10 : 0,
        borderRadius: isExpanded ? 40 : CMDBOX_BORDER_RADIUS,
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: EASE_OUT_CUBIC,
      }}
    >
      {/* Blur Layer Background - 放在外层，z-index 低于内部容器 */}
      <motion.div
        className="absolute blur-[25px] h-[126px] left-[20px] right-[20px] rounded-[999px] top-[51px] z-1 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExpanded ? 0.75 : 0,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.4,
          ease: EASE_OUT_CUBIC,
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/layer.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* 内部 CommandBox 容器 - 固定尺寸 */}
      <div
        className="relative bg-[#fafafa] overflow-hidden z-2 flex flex-col"
        style={{
          width: CMDBOX_WIDTH,
          height: CMDBOX_HEIGHT,
          borderRadius: CMDBOX_BORDER_RADIUS,
        }}
      >
        {/* Content Area */}
        <div className="flex flex-col gap-2 items-start justify-end max-h-[400px] w-full flex-1">
          {/* Text Field */}
          <div className="flex flex-col gap-2 items-start justify-end overflow-hidden pb-[25px] w-full">
            <div className="flex items-start max-h-[400px] rounded-[28px] w-full">
              <div className="flex flex-1 gap-2 items-start min-h-[76px] pb-2 pt-5 px-6 rounded-lg">
                <textarea
                  ref={textareaRef}
                  value={displayText}
                  onChange={(e) => setDisplayText(e.target.value)}
                  className="flex-1 bg-transparent text-[#09090b] text-base font-medium leading-7 tracking-[0.3px] resize-none outline-none min-h-[28px]"
                  style={{
                    fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                    fontFeatureSettings: "'zero'",
                  }}
                  rows={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* General Control - Toolbar */}
        <div className="flex items-center justify-between p-3 w-full">
          {/* Left Actions */}
          <div className="flex items-center gap-0.5 rounded-full">
            {/* Add Button */}
            <button
              type="button"
              className="flex items-center justify-center size-10 rounded-full text-[#3f3f46] transition-colors duration-150 ease [@media(hover:hover)_and_(pointer:fine)]:hover:bg-black/5"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>

            {/* Model Button */}
            <ToolButton icon={<Box size={18} strokeWidth={1.5} />} label="Model" />

            {/* Ratio Button */}
            <ToolButton icon={<RectangleHorizontal size={18} strokeWidth={1.5} />} label="16:9" />

            {/* More Button */}
            <ToolButton icon={<Ellipsis size={18} strokeWidth={1.5} />} label="More" />
          </div>

          {/* Generate Button */}
          <motion.button
            type="button"
            onClick={onGenerate}
            className="relative flex items-center justify-center rounded-full overflow-hidden shadow-[0px_60px_17px_0px_rgba(100,27,202,0),0px_38px_15px_0px_rgba(100,27,202,0.01),0px_21px_13px_0px_rgba(100,27,202,0.05),0px_10px_10px_0px_rgba(100,27,202,0.09),0px_2px_5px_0px_rgba(100,27,202,0.1)] transition-opacity duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgb(134, 61, 251) 0%, rgb(134, 61, 251) 100%)",
              }}
            />
            {/* Video overlay for gradient effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
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

            {/* Button Content */}
            <div className="relative flex gap-2 items-center justify-center pl-4 pr-6 py-2.5">
              <span className="size-[18px] text-white flex items-center justify-center">
                <PlayIcon />
              </span>
              <span
                className="text-white text-sm font-medium tracking-[0.1px] leading-5"
                style={{
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                  fontFeatureSettings: "'zero'",
                }}
              >
                Generate
              </span>
            </div>

            {/* Inner shadow overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-2px_0px_0px_rgba(0,0,0,0.1),inset_0px_1px_0px_0px_rgba(255,255,255,0.25)]" />
          </motion.button>
        </div>
      </div>

      {/* Hint Text with Video Mask Effect - 展开后显示 */}
      <motion.div
        className="relative flex items-center justify-end px-4 overflow-hidden"
        style={{ width: CMDBOX_WIDTH }}
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{
          height: {
            duration: shouldReduceMotion ? 0 : 0.4,
            ease: EASE_OUT_CUBIC,
          },
          opacity: {
            duration: shouldReduceMotion ? 0 : 0.25,
            delay: isExpanded ? 0.15 : 0,
            ease: EASE_OUT_QUINT,
          },
        }}
      >
        <HintText />
      </motion.div>
    </motion.div>
  );
}
