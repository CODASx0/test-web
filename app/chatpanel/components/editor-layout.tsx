"use client";

/**
 * 编辑器布局组件
 * 按照 Figma 设计稿 (502:4620) 还原，使用自适应布局
 * ChatPanel 精确参考 medeo-fe ChatView 实现
 *
 * medeo-fe ChatView 规格:
 * - borderRadius: 20px 20px 24px 24px
 * - backgroundColor: #fafafa
 * - border: 0.5px solid #e4e4e6
 * - marginLeft: 12px (由 gap 实现)
 * - ChatMessage padding: 72px 12px 32px 12px
 */

import {
  AssetsPanel,
  AudioScriptPanel,
  PlayerPanel,
  TimelinePanel,
  TitleBar,
  ChatPanelTitleBar,
  CommandBox,
} from "./panels";

interface EditorLayoutProps {
  children?: React.ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div
      className="flex flex-col w-full h-full min-h-screen bg-white"
      data-name="chatpanel"
    >
      {/* Title bar */}
      <div className="shrink-0 pt-[12px] px-[8px]">
        <div className="h-[44px]">
          <TitleBar />
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-[12px] px-[8px] pt-[12px] pb-[8px] flex-1 min-h-0">
        {/* 左侧 Content: 自适应宽度 */}
        <div className="flex flex-col gap-[12px] flex-1 min-w-0">
          {/* editor&player: 约占 68% 高度 */}
          <div className="flex gap-[12px] flex-[68] min-h-0">
            {/* AssetsPanel: 约 20% */}
            <AssetsPanel className="flex-[20] min-w-[200px]" />

            {/* AudioScriptPanel: 约 23% */}
            <AudioScriptPanel className="flex-[23] min-w-[220px]" />

            {/* PlayerPanel: 约 55% */}
            <PlayerPanel className="flex-[55] min-w-[400px]" />
          </div>

          {/* TimelinePanel: 约占 32% 高度 */}
          <TimelinePanel className="flex-[32] min-h-[200px]" />
        </div>

        {/* ChatPanel: medeo-fe ChatView 精确规格 */}
        <aside
          className="relative w-[368px] shrink-0 flex flex-col overflow-hidden"
          style={{
            // medeo-fe ChatView 精确样式
            borderRadius: "20px 20px 24px 24px",
            backgroundColor: "#fafafa",
            border: "0.5px solid #e4e4e6",
            contain: "layout",
          }}
          data-name="ChatPanel"
        >
          {/* chat-box 内层容器 */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden"
            style={{
              contain: "layout",
              borderRadius: "inherit",
            }}
          >
            {/* ChatHead: 绝对定位在顶部 */}
            <ChatPanelTitleBar />

            {/* ChatMessage: 消息区域 */}
            {/* medeo-fe 规格: padding 72px 12px [statusViewHeight] 12px, flex 1, overflow auto */}
            <div
              className="flex-1 overflow-auto flex flex-col"
              style={{
                padding: "72px 12px 32px 12px",
              }}
              data-name="messages"
            >
              {/* 消息间距由 ChatMessage 组件内部处理: margin 16px 0 */}
              {/* 第一个消息 marginTop: 0 */}
              <style>{`
                [data-name="messages"] > div:first-child {
                  margin-top: 0 !important;
                }
              `}</style>
              {children}
            </div>

            {/* ChatInput: 底部输入区域 */}
            {/* medeo-fe ChatStatus 包裹 ChatInput */}
            <div
              className="shrink-0 px-[12px] pb-[12px]"
              data-name="ChatInput-wrapper"
            >
              <CommandBox disabled />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 自适应布局包装器
interface ScaledEditorLayoutProps {
  children?: React.ReactNode;
}

export function ScaledEditorLayout({ children }: ScaledEditorLayoutProps) {
  return (
    <div className="fixed inset-0 bg-[#e4e4e7] overflow-hidden">
      <EditorLayout>{children}</EditorLayout>
    </div>
  );
}
