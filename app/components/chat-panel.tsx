"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";

// 动画曲线
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;
const EASE_IN_CUBIC = [0.55, 0.055, 0.675, 0.19] as const;

// 动画配置
const ANIMATION_CONFIG = {
  bubbleDelayStep: 0.08, // 每个 bubble 之间的延迟
  initialDelay: 0.3, // 初始延迟
};

// SVG 图标组件
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.3337 4L6.00033 11.3333L2.66699 8"
        stroke="#0EA841"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.66699 4.66667H11.3337M4.66699 7.33333H11.3337M4.66699 10H8.66699"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="5.5" cy="6.5" r="1" fill="currentColor" />
      <path
        d="M2 11L5 8L7 10L10 7L14 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 6L10.5 8L6.5 10V6Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 3.75V14.25M3.75 9H14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 2.625V11.375M7 2.625L3.5 6.125M7 2.625L10.5 6.125"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Loading Spinner 组件
function LoadingSpinner() {
  return (
    <div className="size-[18px] relative">
      <motion.div
        className="absolute inset-0 border-2 border-zinc-200 border-t-zinc-600 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// 工具使用状态组件
interface ToolUseProps {
  icon: React.ReactNode;
  text: string;
  completed?: boolean;
}

function ToolUse({ icon, text, completed = false }: ToolUseProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl">
      <span className="opacity-60 text-[#3f3f46]">{icon}</span>
      <span
        className="text-xs font-medium text-[#3f3f46] opacity-60 tracking-[0.2px]"
        style={{
          fontFamily: "var(--font-manrope, Manrope, sans-serif)",
          fontFeatureSettings: "'zero'",
        }}
      >
        {text}
      </span>
      {completed && <CheckIcon />}
    </div>
  );
}

// 动画消息气泡组件 - 复刻 Dialog 中的 bubble 动画效果
interface AnimatedMessageBubbleProps {
  children: React.ReactNode;
  delay?: number;
  isUser?: boolean;
  isVisible?: boolean;
  className?: string;
}

function AnimatedMessageBubble({ 
  children, 
  delay = 0, 
  isUser = false, 
  isVisible = true,
  className = ""
}: AnimatedMessageBubbleProps) {
  return (
    <motion.div
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
      }}
    >
      {children}
    </motion.div>
  );
}

// 消息气泡组件
interface MessageBubbleProps {
  content: string;
  isUser?: boolean;
  tags?: string[];
  delay?: number;
  isVisible?: boolean;
}

function MessageBubble({ content, isUser = false, tags, delay = 0, isVisible = true }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col gap-2 ${isUser ? "items-end pl-[68px]" : "items-start max-w-[640px]"}`}>
      <AnimatedMessageBubble delay={delay} isUser={isUser} isVisible={isVisible}>
        <div
          className={`px-4 py-3 rounded-xl max-w-[640px] ${
            isUser
              ? "bg-[rgba(134,61,251,0.16)] border border-[rgba(9,9,11,0.08)]"
              : ""
          }`}
        >
          <p
            className={`text-sm font-medium leading-6 tracking-[0.2px] ${
              isUser ? "text-[#2c0051]" : "text-[#09090b]"
            }`}
            style={{
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              fontFeatureSettings: "'zero'",
            }}
          >
            {content}
          </p>
        </div>
      </AnimatedMessageBubble>
      {tags && tags.length > 0 && (
        <AnimatedMessageBubble delay={delay + 0.05} isUser={isUser} isVisible={isVisible}>
          <div className="flex flex-wrap gap-1 items-center justify-end w-full">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-0.5 px-2 py-1 bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg"
              >
                <span
                  className="text-[11px] font-medium text-[#3f3f46] opacity-60 tracking-[0.3px]"
                  style={{
                    fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                    fontFeatureSettings: "'zero'",
                  }}
                >
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </AnimatedMessageBubble>
      )}
    </div>
  );
}

// 媒体网格组件
function MediaGrid() {
  // 示例图片占位符
  const placeholderImages = Array(9).fill(null);

  return (
    <div className="grid grid-cols-3 gap-1 w-full">
      {placeholderImages.map((_, index) => (
        <div
          key={index}
          className="aspect-video bg-[#e4e4e7] rounded-xl overflow-hidden relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-linear-to-br from-zinc-300 to-zinc-200" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <div className="size-6 bg-[#09090b] rounded-lg flex items-center justify-center">
                <PlusIcon />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 状态指示器组件
interface StateIndicatorProps {
  text: string;
  isAnimating?: boolean;
}

function StateIndicator({ text, isAnimating = true }: StateIndicatorProps) {
  return (
    <motion.div
      className="flex items-center gap-2 py-2 px-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT_CUBIC }}
    >
      <LoadingSpinner />
      <div className="flex items-center overflow-hidden">
        <motion.span
          className="text-xs font-medium text-[#3f3f46] tracking-[0.2px] whitespace-nowrap"
          style={{
            fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            fontFeatureSettings: "'zero'",
          }}
          animate={
            isAnimating
              ? {
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {text}
        </motion.span>
      </div>
    </motion.div>
  );
}

interface ChatPanelProps {
  isVisible: boolean;
}

export default function ChatPanel({ isVisible }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 当面板可见时，延迟触发消息动画
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowMessages(true);
        scrollToBottom();
      }, ANIMATION_CONFIG.initialDelay * 1000);
      return () => clearTimeout(timer);
    } else {
      setShowMessages(false);
    }
  }, [isVisible, scrollToBottom]);

  // 计算每个消息元素的延迟
  const getDelay = (index: number) => index * ANIMATION_CONFIG.bubbleDelayStep;

  // 示例对话数据
  const messages = [
    {
      content: "Show me some good movie shots in 30s.",
      isUser: true,
      tags: ["16:9"],
    },
  ];

  return (
    <motion.div
      className="w-[376px] h-[700px] bg-[#fafafa] rounded-3xl overflow-hidden flex flex-col shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.03)]"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.95,
        y: isVisible ? 0 : 20,
      }}
      transition={{
        duration: 0.4,
        ease: EASE_OUT_CUBIC,
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4e4e7]/50">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium text-[#09090b] tracking-[0.2px]"
            style={{
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              fontFeatureSettings: "'zero'",
            }}
          >
            Updated Video Clips
          </span>
          <CheckIcon />
        </div>
        <button
          type="button"
          className="size-8 flex items-center justify-center rounded-xl bg-[#fafafa] border border-[#e4e4e7] text-[#3f3f46] transition-colors [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-100"
        >
          <CloseIcon />
        </button>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-8">
          {/* 用户消息 */}
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              content={msg.content}
              isUser={msg.isUser}
              tags={msg.tags}
              delay={getDelay(0)}
              isVisible={showMessages}
            />
          ))}

          {/* AI 回复 */}
          <div className="flex flex-col gap-4 max-w-[640px]">
            {/* 思考状态 */}
            <AnimatedMessageBubble delay={getDelay(2)} isVisible={showMessages}>
              <div className="flex items-center rounded-xl">
                <span
                  className="text-xs font-medium text-[#3f3f46] opacity-60 tracking-[0.2px]"
                  style={{
                    fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                    fontFeatureSettings: "'zero'",
                  }}
                >
                  Thinking complete
                </span>
              </div>
            </AnimatedMessageBubble>

            {/* AI 文本回复 */}
            <AnimatedMessageBubble delay={getDelay(3)} isVisible={showMessages}>
              <p
                className="text-sm font-medium text-[#09090b] leading-5 tracking-[0.2px]"
                style={{
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                  fontFeatureSettings: "'zero'",
                }}
              >
                I&apos;ll create a 30-second cinematic showcase featuring Oscar-winning film aesthetics with 27 shots. Let me start by planning this project.
              </p>
            </AnimatedMessageBubble>

            {/* 工具使用状态 */}
            <AnimatedMessageBubble delay={getDelay(4)} isVisible={showMessages}>
              <ToolUse icon={<ArticleIcon />} text="Wrote Script" completed />
            </AnimatedMessageBubble>

            <AnimatedMessageBubble delay={getDelay(5)} isVisible={showMessages}>
              <p
                className="text-sm font-medium text-[#09090b] leading-5 tracking-[0.2px]"
                style={{
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                  fontFeatureSettings: "'zero'",
                }}
              >
                Now I&apos;ll create a task list and begin generating all the visual assets using Gemini 3 Pro (Nano Banana).
              </p>
            </AnimatedMessageBubble>

            <AnimatedMessageBubble delay={getDelay(6)} isVisible={showMessages}>
              <ToolUse icon={<ImageIcon />} text="Generated Images" completed />
            </AnimatedMessageBubble>

            {/* 媒体网格 */}
            <AnimatedMessageBubble delay={getDelay(7)} isVisible={showMessages}>
              <MediaGrid />
            </AnimatedMessageBubble>

            <AnimatedMessageBubble delay={getDelay(8)} isVisible={showMessages}>
              <ToolUse icon={<VideoIcon />} text="Updated Video Clips" completed />
            </AnimatedMessageBubble>

            <AnimatedMessageBubble delay={getDelay(9)} isVisible={showMessages}>
              <p
                className="text-sm font-medium text-[#09090b] leading-5 tracking-[0.2px]"
                style={{
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                  fontFeatureSettings: "'zero'",
                }}
              >
                Perfect! Your IMAX-quality Oscar-winning film collection has been remastered!
              </p>
            </AnimatedMessageBubble>
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 渐变遮罩 */}
      <div className="absolute bottom-[142px] left-3 right-3 h-24 bg-linear-to-t from-[#fafafa] to-transparent pointer-events-none" />

      {/* 底部命令框区域 */}
      <div className="relative px-3 pb-3">
        {/* 状态指示器 */}
        <StateIndicator text="Putting it all together..." />

        {/* 输入框 */}
        <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden">
          {/* 输入区域 */}
          <div className="px-2 py-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-transparent text-sm font-medium text-[#09090b] placeholder:text-[#09090b] placeholder:opacity-20 outline-none tracking-[0.2px] px-1.5 py-1"
              style={{
                fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                fontFeatureSettings: "'zero'",
              }}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              {/* 添加按钮 */}
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded-[10px] text-[#3f3f46] transition-colors [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-100"
              >
                <PlusIcon />
              </button>

              {/* 模型选择按钮 */}
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded-[10px] text-[#3f3f46] transition-colors [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-100"
              >
                <ModelIcon />
              </button>
            </div>

            {/* 发送按钮 */}
            <button
              type="button"
              className="size-8 flex items-center justify-center rounded-full bg-[#09090b] text-white transition-transform [@media(hover:hover)_and_(pointer:fine)]:hover:scale-105"
              style={{
                boxShadow:
                  "inset 0px 2px 1px 0px rgba(255,255,255,0.1), inset 0px 4px 10px 0px rgba(255,255,255,0.2)",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
