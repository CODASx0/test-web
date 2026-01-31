"use client";

/**
 * ChatPanel 演示页面
 * 按照 Figma 设计稿还原
 */

import { useState } from "react";
import { ScaledEditorLayout } from "./components/editor-layout";
import ChatPanel from "./components/chat-panel";
import { mockNotificationList, mockNotificationList1, mockNotificationList2 } from "./mock-notif";

// 演示数据选项
const DEMO_OPTIONS = [
  { id: "full", label: "完整对话", data: mockNotificationList },
  { id: "text", label: "纯文本", data: mockNotificationList1 },
  { id: "tool", label: "工具调用", data: mockNotificationList2 },
] as const;

type DemoId = (typeof DEMO_OPTIONS)[number]["id"];

export default function ChatPanelPage() {
  const [selectedDemo, setSelectedDemo] = useState<DemoId>("full");
  const [playbackSpeed, setPlaybackSpeed] = useState(50);

  const currentDemoData = DEMO_OPTIONS.find((opt) => opt.id === selectedDemo)?.data || [];

  return (
    <>
      {/* 控制面板 */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-3 p-4 bg-white rounded-xl shadow-lg border border-[#e4e4e7] min-w-[200px]">
        <h3 className="text-sm font-semibold text-[#09090b]">控制面板</h3>

        {/* 演示数据选择 */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#3f3f46] opacity-60">演示数据</span>
          <div className="flex gap-1 flex-wrap">
            {DEMO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedDemo(opt.id)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  selectedDemo === opt.id
                    ? "bg-[#09090b] text-white"
                    : "bg-[#f4f4f5] text-[#3f3f46] hover:bg-[#e4e4e7]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 播放速度 */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#3f3f46] opacity-60">
            速度: {playbackSpeed}ms
          </span>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-full h-1 bg-[#e4e4e7] rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* 统计 */}
        <div className="pt-2 border-t border-[#e4e4e7]">
          <span className="text-xs text-[#3f3f46] opacity-40">
            通知: {currentDemoData.length}
          </span>
        </div>
      </div>

      {/* 主内容 */}
      <ScaledEditorLayout>
        <ChatPanel
          key={selectedDemo}
          notifications={currentDemoData}
          playbackSpeed={playbackSpeed}
        />
      </ScaledEditorLayout>
    </>
  );
}
