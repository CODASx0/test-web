"use client";

/**
 * 线框占位组件
 * 用于 ChatPanel 以外的区域，显示统一的线框样式
 */

interface WireframeProps {
  className?: string;
  label?: string;
  children?: React.ReactNode;
}

// 通用线框容器
export function Wireframe({ className = "", label, children }: WireframeProps) {
  return (
    <div
      className={`relative border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl ${className}`}
    >
      {label && (
        <span className="absolute top-2 left-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

// 资源面板线框
export function AssetsPanelWireframe() {
  return (
    <Wireframe label="Assets" className="w-[200px] h-full flex flex-col gap-2 p-4 pt-8">
      <div className="flex gap-2 border-b border-gray-200 pb-2 mb-2">
        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">Media</span>
        <span className="text-xs text-gray-400 px-2 py-1">Docs</span>
      </div>
      {/* 模拟资源缩略图 */}
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"
          />
        ))}
      </div>
    </Wireframe>
  );
}

// 脚本面板线框
export function ScriptPanelWireframe() {
  return (
    <Wireframe label="Audio Script" className="w-[280px] h-full flex flex-col gap-3 p-4 pt-8">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Caption</span>
        <div className="w-8 h-4 bg-gray-200 rounded-full" />
      </div>
      {/* 模拟脚本内容 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-xs text-gray-300 w-10 shrink-0">00:{String(i * 24).padStart(2, '0')}</span>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      ))}
    </Wireframe>
  );
}

// 视频预览面板线框
export function VideoPreviewWireframe() {
  return (
    <Wireframe label="Video Preview" className="flex-1 h-full flex flex-col p-4 pt-8">
      {/* 视频区域 */}
      <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-400 border-b-8 border-b-transparent ml-1" />
        </div>
      </div>
      {/* 进度条 */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">00:02.32</span>
          <div className="flex-1 h-1 bg-gray-200 rounded-full">
            <div className="w-1/4 h-full bg-gray-400 rounded-full" />
          </div>
          <span className="text-xs text-gray-400">9:16</span>
        </div>
      </div>
    </Wireframe>
  );
}

// 时间线面板线框
export function TimelinePanelWireframe() {
  return (
    <Wireframe label="Timeline" className="w-full h-[180px] p-4 pt-8">
      {/* 时间刻度 */}
      <div className="flex items-center gap-8 mb-4 px-4">
        {['00:00', '00:01', '00:02', '00:03', '00:04', '00:05'].map((time) => (
          <span key={time} className="text-xs text-gray-300">{time}</span>
        ))}
      </div>
      {/* 轨道 */}
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg flex items-center px-2">
              <div className="w-8 h-8 bg-gray-400/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Wireframe>
  );
}

// 完整布局线框（不含 ChatPanel）
export function EditorLayoutWireframe({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white">
      {/* 左侧资源面板 */}
      <AssetsPanelWireframe />

      {/* 中间区域 */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1">
          {/* 脚本面板 */}
          <ScriptPanelWireframe />

          {/* 视频预览 */}
          <VideoPreviewWireframe />
        </div>

        {/* 底部时间线 */}
        <TimelinePanelWireframe />
      </div>

      {/* 右侧 ChatPanel */}
      {children}
    </div>
  );
}
