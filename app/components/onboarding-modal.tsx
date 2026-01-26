"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// 动画曲线
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

interface OnboardingModalProps {
  onStartWithRecipe?: () => void;
}

export default function OnboardingModal({ onStartWithRecipe }: OnboardingModalProps) {
  const titleVideoRef = useRef<HTMLVideoElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);
  const titleFadeStart = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  // 节流：限制为约 30fps
  const FRAME_INTERVAL = 1000 / 30;

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

    const drawFrame = (timestamp: number) => {
      // 节流检查
      if (timestamp - lastFrameTime.current < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      lastFrameTime.current = timestamp;

      if (video.readyState >= 2) {
        const rect = text.getBoundingClientRect();
        const w = Math.ceil(rect.width) || 350;
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
          tempCtx.filter = "blur(20px)";
          tempCtx.drawImage(video, w * 0.4, -h * 2, w * 1.5, h * 5);
          tempCtx.filter = "none";

          // 3. 创建从左到右的渐变遮罩
          maskCtx.clearRect(0, 0, w, h);
          const gradient = maskCtx.createLinearGradient(0, 0, w, 0);
          gradient.addColorStop(0, "rgba(0,0,0,0)");
          gradient.addColorStop(0.6, "rgba(0,0,0,0)");
          gradient.addColorStop(0.8, "rgba(0,0,0,1)");
          gradient.addColorStop(1, "rgba(0,0,0,1)");
          maskCtx.fillStyle = gradient;
          maskCtx.fillRect(0, 0, w, h);

          // 4. 将遮罩应用到彩色视频
          tempCtx.globalCompositeOperation = "destination-in";
          tempCtx.drawImage(maskCanvas, 0, 0);
          tempCtx.globalCompositeOperation = "source-over";

          // 5. 渐变淡入
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
      tempCanvas.width = 0;
      tempCanvas.height = 0;
      maskCanvas.width = 0;
      maskCanvas.height = 0;
    };
  }, [FRAME_INTERVAL]);

  return (
    <div
      className="bg-[#fafafa] border border-[#d4d4d8]/50 flex flex-col isolate items-end overflow-clip relative rounded-[24px] w-[669px] shadow-[0px_6px_2px_0px_rgba(0,0,0,0),0px_4px_1px_0px_rgba(0,0,0,0.01),0px_2px_1px_0px_rgba(0,0,0,0.03),0px_1px_1px_0px_rgba(0,0,0,0.04)]"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Header - Title */}
      <div className="bg-white flex flex-col gap-5 items-start justify-center pb-2 pt-[26px] px-8 relative shrink-0 w-full z-[3]">
        <div className="flex gap-1.5 items-center justify-center relative shrink-0">
          <div className="relative shrink-0 h-8 flex items-center">
            {/* 标题文本 - 带渐变色效果 */}
            <span
              id="modal-title"
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
              Now your first creation is ready!
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

      {/* Content */}
      <div className="bg-gradient-to-b from-white to-[#fafafa] flex flex-col gap-2 items-start overflow-clip pb-6 px-8 relative shrink-0 w-full z-[2]">
        <div className="flex gap-2.5 items-start relative shrink-0 w-full">
          <p
            className="flex-1 font-medium leading-5 text-[#3f3f46] text-sm tracking-[0.2px]"
            style={{
              fontFamily: "var(--font-manrope)",
              fontFeatureSettings: "'zero'",
            }}
          >
            You can now freely browse the project content until you want to learn more about Recipe.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#e4e4e7]/50 flex gap-3.5 items-center justify-end p-4 relative shrink-0 w-full z-[1]">
        {/* Start with Recipe Button */}
        <button
          type="button"
          aria-label="Start with Recipe"
          onClick={onStartWithRecipe}
          data-guide-target="start-recipe"
          className="bg-[#09090b] border border-[rgba(9,9,11,0.12)]/50 flex flex-col h-10 items-center justify-center overflow-clip relative rounded-xl shrink-0 cursor-pointer transition-opacity duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
        >
          <div className="flex gap-1 items-center justify-center pl-6 pr-4 py-3 relative shrink-0 w-full">
            <span
              className="flex flex-col font-medium justify-center relative shrink-0 text-white text-sm text-center tracking-[0.1px] leading-5"
              style={{
                fontFamily: "var(--font-manrope)",
                fontFeatureSettings: "'zero'",
              }}
            >
              Start with Recipe
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
