"use client";

/**
 * ChatPanel 组件
 * 参考 Figma 设计和 medeo-fe 的实现，用 React 重新构建
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextPart, ThinkingPart, ToolPart, MediaPart, ErrorPart, type ToolStatus } from "./message-parts";
import { type Notification, NotifType, DeltaType, ContentPartType } from "../types";

// ==================== 类型定义 ====================

interface MessageItem {
  id: string;
  type: "user" | "agent";
  parts: MessagePart[];
  isStreaming?: boolean;
}

interface MessagePart {
  id: string;
  type: "text" | "thinking" | "tool" | "media" | "error";
  content: unknown;
}

// ==================== ChatPanel 组件 ====================

interface ChatPanelProps {
  notifications?: Notification[];
  autoPlay?: boolean;
  playbackSpeed?: number; // 毫秒/通知
}

export default function ChatPanel({
  notifications = [],
  autoPlay = true,
  playbackSpeed = 50,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentAIMessage, setCurrentAIMessage] = useState<MessageItem | null>(null);
  const [currentTextBuffer, setCurrentTextBuffer] = useState("");
  const [currentThinkingBuffer, setCurrentThinkingBuffer] = useState("");
  const [activeToolCalls, setActiveToolCalls] = useState<Map<string, ToolStatus>>(new Map());

  const scrollRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 使用 ref 追踪最新状态，解决闭包捕获旧值的问题
  const currentAIMessageRef = useRef<MessageItem | null>(null);
  const currentTextBufferRef = useRef("");
  const currentThinkingBufferRef = useRef("");

  // 同步 ref 和 state
  useEffect(() => {
    currentAIMessageRef.current = currentAIMessage;
  }, [currentAIMessage]);

  useEffect(() => {
    currentTextBufferRef.current = currentTextBuffer;
  }, [currentTextBuffer]);

  useEffect(() => {
    currentThinkingBufferRef.current = currentThinkingBuffer;
  }, [currentThinkingBuffer]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // 处理单个通知 - 使用 ref 获取最新状态
  const processNotification = useCallback((notif: Notification) => {
    switch (notif.type) {
      case NotifType.CHAT_MSG_HANDLING_STARTED:
        // 开始新的对话处理
        break;

      case NotifType.CHAT_MSG_HANDLING_ENDED: {
        // 对话处理结束，完成当前 AI 消息
        // 参考 medeo-fe: 这是唯一将消息提交到列表的地方
        // 重要：不要在 setState 回调中嵌套调用另一个 setState
        const currentMsg = currentAIMessageRef.current;
        if (currentMsg) {
          const textBuf = currentTextBufferRef.current;
          const thinkingBuf = currentThinkingBufferRef.current;
          let finalParts = [...currentMsg.parts];

          // 添加剩余的文本缓冲
          if (textBuf) {
            finalParts.push({
              id: `text-final-${Date.now()}`,
              type: "text",
              content: { text: textBuf, isUser: false },
            });
          }

          // 添加剩余的思考缓冲
          if (thinkingBuf) {
            finalParts.push({
              id: `thinking-final-${Date.now()}`,
              type: "thinking",
              content: { text: thinkingBuf, status: "COMPLETED" as const },
            });
          }

          // 只有有内容时才添加到消息列表
          if (finalParts.length > 0) {
            setMessages((msgs) => [...msgs, { ...currentMsg, parts: finalParts, isStreaming: false }]);
          }
        }

        // 清空当前消息和缓冲
        setCurrentAIMessage(null);
        currentAIMessageRef.current = null;
        setCurrentTextBuffer("");
        setCurrentThinkingBuffer("");
        currentTextBufferRef.current = "";
        currentThinkingBufferRef.current = "";
        break;
      }

      case NotifType.AI_MSG_STARTED: {
        // 开始新的 AI 消息
        // 如果已有当前消息，先保存到列表
        const prevMsg = currentAIMessageRef.current;
        if (prevMsg && prevMsg.parts.length > 0) {
          setMessages((msgs) => [...msgs, { ...prevMsg, isStreaming: false }]);
        }

        const newAIMsg: MessageItem = {
          id: notif.body.ai_msg_started?.beginning?.id || `ai-${Date.now()}`,
          type: "agent",
          parts: [],
          isStreaming: true,
        };
        setCurrentAIMessage(newAIMsg);
        currentAIMessageRef.current = newAIMsg;
        // 清空缓冲
        setCurrentTextBuffer("");
        setCurrentThinkingBuffer("");
        currentTextBufferRef.current = "";
        currentThinkingBufferRef.current = "";
        break;
      }

      case NotifType.AI_MSG_ENDED:
        // AI 消息结束 - 参考 medeo-fe: 只更新状态，不移动消息
        // 消息的最终提交由 CHAT_MSG_HANDLING_ENDED 处理
        break;

      case NotifType.CONTENT_PART_DELTA:
        // 内容增量更新
        const delta = notif.body.content_part_delta;
        if (delta) {
          if (delta.delta_type === DeltaType.TEXT_DELTA && delta.delta.text_delta) {
            setCurrentTextBuffer((prev) => {
              const newVal = prev + (delta.delta.text_delta?.text || "");
              currentTextBufferRef.current = newVal;
              return newVal;
            });
          } else if (delta.delta_type === DeltaType.THINKING_DELTA && delta.delta.thinking_delta) {
            setCurrentThinkingBuffer((prev) => {
              const newVal = prev + (delta.delta.thinking_delta?.thinking || "");
              currentThinkingBufferRef.current = newVal;
              return newVal;
            });
          }
        }
        break;

      case NotifType.CONTENT_PART_ENDED:
        // 内容部分结束，提交当前缓冲
        const textBufEnded = currentTextBufferRef.current;
        const thinkingBufEnded = currentThinkingBufferRef.current;

        if (textBufEnded) {
          const textPart: MessagePart = {
            id: `text-${Date.now()}`,
            type: "text",
            content: { text: textBufEnded, isUser: false },
          };
          setCurrentAIMessage((prev) => {
            if (!prev) return null;
            const updated = { ...prev, parts: [...prev.parts, textPart] };
            currentAIMessageRef.current = updated;
            return updated;
          });
          setCurrentTextBuffer("");
          currentTextBufferRef.current = "";
        }
        if (thinkingBufEnded) {
          const thinkingPart: MessagePart = {
            id: `thinking-${Date.now()}`,
            type: "thinking",
            content: { text: thinkingBufEnded, status: "COMPLETED" as const },
          };
          setCurrentAIMessage((prev) => {
            if (!prev) return null;
            const updated = { ...prev, parts: [...prev.parts, thinkingPart] };
            currentAIMessageRef.current = updated;
            return updated;
          });
          setCurrentThinkingBuffer("");
          currentThinkingBufferRef.current = "";
        }
        break;

      case NotifType.TOOL_RUN_STARTED: {
        // 工具开始运行
        const toolStarted = notif.body.tool_run_started;
        if (toolStarted) {
          setActiveToolCalls((prev) => new Map(prev).set(toolStarted.tool_call_id, "RUNNING"));
          const toolPart: MessagePart = {
            id: `tool-${toolStarted.tool_call_id}`,
            type: "tool",
            content: {
              name: toolStarted.tool_display_name,
              toolCallId: toolStarted.tool_call_id,
              status: "RUNNING" as ToolStatus,
            },
          };

          // 使用 ref 检查是否有当前消息
          const currentMsg = currentAIMessageRef.current;
          if (currentMsg) {
            // 有当前消息，追加工具部分
            setCurrentAIMessage((prev) => {
              if (!prev) return null;
              const updated = { ...prev, parts: [...prev.parts, toolPart] };
              currentAIMessageRef.current = updated;
              return updated;
            });
          } else {
            // 没有当前消息，创建新的
            const newToolMsg: MessageItem = {
              id: `ai-tool-${Date.now()}`,
              type: "agent",
              parts: [toolPart],
              isStreaming: true,
            };
            setCurrentAIMessage(newToolMsg);
            currentAIMessageRef.current = newToolMsg;
          }
        }
        break;
      }

      case NotifType.TOOL_RUN_ENDED:
        // 工具运行结束
        const toolEnded = notif.body.tool_run_ended;
        if (toolEnded) {
          setActiveToolCalls((prev) => {
            const newMap = new Map(prev);
            newMap.set(toolEnded.tool_call_id, "COMPLETED");
            return newMap;
          });

          // 提取媒体 URL
          const mediaUrls: string[] = [];
          if (toolEnded.result_list && toolEnded.result_list.length > 0) {
            for (const result of toolEnded.result_list) {
              if (result.data) {
                for (const item of result.data) {
                  if (item.file_reference?.media?.storage_key) {
                    mediaUrls.push(item.file_reference.media.storage_key);
                  }
                }
              }
            }
          }

          // 更新工具状态并添加媒体
          // 参考 medeo-fe: 所有内容都添加到当前消息，不直接操作 messages
          setCurrentAIMessage((prev) => {
            if (!prev) {
              // 如果没有当前消息，创建一个新的来容纳内容
              const parts: MessagePart[] = [];
              if (mediaUrls.length > 0) {
                parts.push({
                  id: `media-${Date.now()}`,
                  type: "media",
                  content: { urls: mediaUrls },
                });
              }
              if (parts.length > 0) {
                const newMsg: MessageItem = {
                  id: `ai-media-${Date.now()}`,
                  type: "agent",
                  parts,
                  isStreaming: true,
                };
                currentAIMessageRef.current = newMsg;
                return newMsg;
              }
              return null;
            }

            // 更新工具状态
            let newParts = prev.parts.map((part) => {
              if (part.type === "tool" && (part.content as { toolCallId: string }).toolCallId === toolEnded.tool_call_id) {
                return {
                  ...part,
                  content: { ...part.content as object, status: "COMPLETED" as ToolStatus },
                };
              }
              return part;
            });

            // 添加媒体部分
            if (mediaUrls.length > 0) {
              const mediaPart: MessagePart = {
                id: `media-${Date.now()}`,
                type: "media",
                content: { urls: mediaUrls },
              };
              newParts = [...newParts, mediaPart];
            }

            const updated = { ...prev, parts: newParts };
            currentAIMessageRef.current = updated;
            return updated;
          });
        }
        break;

      default:
        break;
    }

    scrollToBottom();
  }, [scrollToBottom]);

  // 播放控制
  useEffect(() => {
    if (isPlaying && currentNotifIndex < notifications.length) {
      playIntervalRef.current = setTimeout(() => {
        processNotification(notifications[currentNotifIndex]);
        setCurrentNotifIndex((prev) => prev + 1);
      }, playbackSpeed);
    }

    return () => {
      if (playIntervalRef.current) {
        clearTimeout(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentNotifIndex, notifications, playbackSpeed, processNotification]);

  // 重置播放
  const handleReset = () => {
    setMessages([]);
    setCurrentNotifIndex(0);
    setCurrentAIMessage(null);
    setCurrentTextBuffer("");
    setCurrentThinkingBuffer("");
    setActiveToolCalls(new Map());
    setIsPlaying(true);
  };

  // 渲染消息部分
  const renderPart = (part: MessagePart) => {
    switch (part.type) {
      case "text": {
        const content = part.content as { text: string; isUser: boolean };
        return <TextPart key={part.id} text={content.text} isUser={content.isUser} />;
      }
      case "thinking": {
        const content = part.content as { text: string; status: "RUNNING" | "COMPLETED" };
        return <ThinkingPart key={part.id} text={content.text} status={content.status} />;
      }
      case "tool": {
        const content = part.content as { name: string; status: ToolStatus };
        return <ToolPart key={part.id} name={content.name} status={content.status} />;
      }
      case "media": {
        const content = part.content as { urls: string[] };
        return <MediaPart key={part.id} urls={content.urls} />;
      }
      case "error": {
        const content = part.content as { message: string };
        return <ErrorPart key={part.id} message={content.message} />;
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Messages - 直接渲染消息内容，标题和输入框由外层 editor-layout 提供 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex flex-col gap-2 ${message.type === "user" ? "items-end pl-12" : "items-start"}`}
            >
              {message.parts.map(renderPart)}
            </motion.div>
          ))}

          {/* 正在流式输出的 AI 消息 */}
          {currentAIMessage && (
            <motion.div
              key="current-ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2 items-start"
            >
              {currentAIMessage.parts.map(renderPart)}
              {/* 显示正在缓冲的文本 */}
              {currentTextBuffer && (
                <TextPart text={currentTextBuffer} isStreaming />
              )}
              {/* 显示正在缓冲的思考 */}
              {currentThinkingBuffer && (
                <ThinkingPart text={currentThinkingBuffer} status="RUNNING" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 空状态 */}
        {messages.length === 0 && !currentAIMessage && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f4f5] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[#3f3f46] opacity-40" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-[#3f3f46] opacity-50">
              {notifications.length > 0 ? "Click play to start" : "No messages yet"}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
