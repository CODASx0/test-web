"use client";

/**
 * 消息内容部分组件
 * 精确按照 medeo-fe 设计规范还原
 *
 * 设计 Token:
 * - Body-Medium: 14px, line-height 20px, letter-spacing 0.2px, weight 500
 * - Body-Small: 12px, line-height 16px
 * - Label-Medium: 12px, line-height 16px
 * - UserTextPart: maxWidth 80%, padding 12px 16px, borderRadius 12px, bg #ebe0fe
 * - ToolPart: padding 8px 12px, borderRadius 12px, border 0.5px #E4E4E7, bg #f4f4f5
 * - ErrorPart: padding 8px 12px, borderRadius 12px, bg #FFDAD6
 */

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

// 工具状态
export type ToolStatus = "PENDING" | "RUNNING" | "COMPLETED" | "ERROR";

// ==================== 图标组件 ====================

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "#0EA841" }}
    >
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "#FF0000" }}
    >
      <path
        d="M6 6l12 12M18 6l-12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ErrorFillIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "#BA1A1A", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M12 8v5M12 16h.01"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToolIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity: 0.6 }}
    >
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ==================== 文本消息部分 ====================

interface TextPartProps {
  text: string;
  isStreaming?: boolean;
  isUser?: boolean;
}

/**
 * TextPart - 文本消息
 * medeo-fe 规格:
 * - UserTextPart: maxWidth 80%, padding 12px 16px, borderRadius 12px
 *   background: #ebe0fe, border: 0.5px solid rgba(9,9,11,0.08)
 *   color: #2c0051
 * - AgentTextPart: 使用 Markdown 渲染, color #09090B
 * - font: 14px, line-height 20px (user 24px), letter-spacing 0.2px, weight 500
 */
export function TextPart({ text, isStreaming = false, isUser = false }: TextPartProps) {
  if (isUser) {
    return (
      <div
        style={{
          maxWidth: "80%",
          display: "flex",
          padding: "12px 16px",
          alignItems: "center",
          gap: "8px",
          borderRadius: "12px",
          border: "0.5px solid rgba(9, 9, 11, 0.08)",
          background: "#ebe0fe",
        }}
      >
        <span
          style={{
            width: "100%",
            whiteSpace: "normal",
            wordBreak: "break-word",
            color: "#2c0051",
            fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "24px",
            letterSpacing: "0.2px",
            fontFeatureSettings: "'zero'",
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  // Agent 消息使用 Markdown 渲染
  return (
    <div
      className="streamdown-container"
      style={{
        alignSelf: "stretch",
        color: "#09090B",
        fontFamily: "var(--font-manrope, Manrope, sans-serif)",
        fontSize: "14px",
        fontWeight: 500,
        lineHeight: "20px",
        letterSpacing: "0.2px",
        fontFeatureSettings: "'zero'",
      }}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
      {isStreaming && (
        <motion.span
          style={{
            display: "inline-block",
            width: "2px",
            height: "16px",
            background: "currentColor",
            marginLeft: "2px",
            verticalAlign: "middle",
          }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// ==================== 思考内容部分 ====================

interface ThinkingPartProps {
  text: string;
  status: "RUNNING" | "COMPLETED";
}

/**
 * ThinkingPart - 思考过程
 * medeo-fe 规格:
 * - 标签: color #3F3F46, font 12px, line-height 16px, opacity 0.6
 * - RUNNING 时有 shimmer 动画
 * - 内容区 gap 16px
 */
export function ThinkingPart({ text, status }: ThinkingPartProps) {
  const isRunning = status === "RUNNING";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* 状态标签 */}
      <div style={{ display: "inline-block" }}>
        <span
          style={{
            color: "#3F3F46",
            fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            letterSpacing: "0.2px",
            opacity: 0.6,
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            ...(isRunning
              ? {
                  WebkitTextFillColor: "transparent",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 27%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.5) 58%, rgba(255,255,255,0) 72%), #3F3F46",
                  animation: "shimmer 2s linear infinite",
                }
              : {}),
          }}
        >
          {isRunning ? "Thinking" : "Thinking Completed"}
        </span>
      </div>

      {/* 思考内容 */}
      <span
        style={{
          alignSelf: "stretch",
          color: "#09090B",
          fontFamily: "var(--font-manrope, Manrope, sans-serif)",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "20px",
          letterSpacing: "0.2px",
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ==================== 工具调用部分 ====================

interface ToolPartProps {
  name: string;
  status: ToolStatus;
  icon?: React.ReactNode;
}

/**
 * ToolPart - 工具调用
 * medeo-fe 规格:
 * - 容器: padding 8px 12px, gap 8px, borderRadius 12px
 *   border: 0.5px solid #E4E4E7, background: #f4f4f5
 * - 图标: 16x16, opacity 0.6
 * - 文字: 12px, line-height 16px, color #3F3F46, opacity 0.6
 * - RUNNING 时有 shimmer 动画
 * - animation: toolAnim 0.2s ease-out
 */
export function ToolPart({ name, status, icon }: ToolPartProps) {
  const isRunning = status === "RUNNING";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          display: "flex",
          alignSelf: "start",
          padding: "8px 12px",
          alignItems: "center",
          gap: "8px",
          borderRadius: "12px",
          border: "0.5px solid #E4E4E7",
          background: "#f4f4f5",
          transformOrigin: "left bottom",
        }}
      >
        {/* 图标 */}
        <div style={{ width: 16, height: 16, opacity: 0.6 }}>
          {icon || <ToolIcon size={16} />}
        </div>

        {/* 工具名称 */}
        <span
          style={{
            fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            letterSpacing: "0.2px",
            color: "#3F3F46",
            opacity: 0.6,
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            ...(isRunning
              ? {
                  WebkitTextFillColor: "transparent",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 27%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.5) 58%, rgba(255,255,255,0) 72%), #3F3F46",
                  animation: "shimmer 2s linear infinite",
                }
              : {}),
          }}
        >
          {name}
        </span>

        {/* 状态图标 */}
        {status === "COMPLETED" && <CheckIcon size={16} />}
        {status === "ERROR" && <CloseIcon size={16} />}
        {status === "RUNNING" && (
          <motion.div
            style={{
              width: 16,
              height: 16,
              border: "2px solid #3F3F46",
              borderTopColor: "transparent",
              borderRadius: "50%",
              opacity: 0.6,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.div>
    </div>
  );
}

// ==================== 媒体部分（图片网格） ====================

interface MediaPartProps {
  urls: string[];
  aspectRatio?: number;
}

/**
 * MediaPart - 媒体内容
 * medeo-fe 规格:
 * - 图片容器有 borderRadius
 * - aspectRatio 根据内容类型决定
 */
export function MediaPart({ urls, aspectRatio = 1 }: MediaPartProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: "6px",
        width: "100%",
        gridTemplateColumns: `repeat(${Math.min(urls.length, 3)}, minmax(0, 1fr))`,
      }}
    >
      {urls.map((url, index) => (
        <motion.div
          key={`${url}-${index}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.05, type: "spring", duration: 0.3 }}
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            background: "rgba(74, 68, 89, 0.08)",
            aspectRatio,
          }}
        >
          <img
            src={url}
            alt={`Generated ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ==================== 错误部分 ====================

interface ErrorPartProps {
  message: string;
  action?: {
    name: string;
    onClick: () => void;
  };
}

/**
 * ErrorPart - 错误提示
 * medeo-fe 规格:
 * - 容器: padding 8px 12px, borderRadius 12px, minHeight 44px
 *   outline: 0.5px solid rgba(9,9,11,0.08), background: #FFDAD6
 * - 图标: 18x18, color #BA1A1A
 * - 文字: 14px, line-height 20px, color #410002
 * - 按钮: color #BA1A1A
 */
export function ErrorPart({ message, action }: ErrorPartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        maxWidth: "360px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          minHeight: "44px",
          padding: "8px 12px",
          borderRadius: "12px",
          outline: "0.5px solid rgba(9, 9, 11, 0.08)",
          outlineOffset: "-0.5px",
          background: "#FFDAD6",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "start",
              justifyContent: "start",
              gap: "8px",
            }}
          >
            <ErrorFillIcon size={18} />
          </div>
          <span
            style={{
              flex: 1,
              color: "#410002",
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "20px",
              letterSpacing: "0.2px",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {message}
          </span>
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              flexShrink: 0,
              padding: "4px 8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#BA1A1A",
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "20px",
              letterSpacing: "0.1px",
            }}
          >
            {action.name}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ==================== CSS 动画 ====================

// 需要在全局 CSS 中添加以下动画：
/*
@keyframes shimmer {
  0% { background-position: 100% center; }
  100% { background-position: -100% center; }
}

@keyframes toolAnim {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(0.5); }
  100% { transform: scale(1); }
}

@keyframes blurIn {
  from { filter: blur(5px); }
  to { filter: blur(0px); }
}

@keyframes opacityAnim {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
*/
