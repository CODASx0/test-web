'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

// 用于显示当前进度的辅助组件
const ProgressDisplay = ({ value }: { value: MotionValue<number> }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(value, "change", (latest) => {
    if (ref.current) {
      ref.current.textContent = latest.toFixed(3);
    }
  });

  return <span ref={ref} className="font-mono text-blue-400">0.000</span>;
};

interface FeatureItemProps {
  index: number;
  className?: string;
}

const FeatureItem = ({ index, className }: FeatureItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 核心逻辑：获取 0 到 1 的滚动进度参数
  // start end: 元素顶部 接触 视口底部 -> 0
  // end start: 元素底部 接触 视口顶部 -> 1
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // 基于 0-1 参数的示例动画
  // 0 -> 0.5 (中心) -> 1
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["rgba(23, 23, 23, 1)", "rgba(38, 38, 38, 1)", "rgba(23, 23, 23, 1)"]
  );

  return (
    <motion.div
      ref={containerRef}
      style={{ 
        scale, 
        opacity,
        backgroundColor
      }}
      className={cn(
        "w-full aspect-[3/2] relative flex flex-col items-center justify-center rounded-2xl border border-white/10 overflow-hidden",
        className
      )}
    >
      <motion.div style={{ y }} className="text-center space-y-4 p-6">
        <h3 className="text-4xl font-bold text-white">
          Section {index + 1}
        </h3>
        <div className="text-lg text-neutral-400">
          Scroll Progress: <ProgressDisplay value={scrollYProgress} />
        </div>
        <p className="max-w-md text-sm text-neutral-500 mx-auto">
          这个 section 的动画完全由 scrollYProgress (0 to 1) 驱动。
          当进度为 0.5 时，元素处于视口中心位置（假设视口高度足够）。
        </p>
      </motion.div>
      
      {/* 进度条可视化 */}
      <div className="absolute bottom-8 left-8 right-8 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-blue-500"
          style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
        />
      </div>
    </motion.div>
  );
};

export function FeaturesSection() {
  return (
    <section className="w-full py-20 px-4 md:px-8 bg-black">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Scroll Animations Demo</h2>
            <p className="text-neutral-400">向下滚动查看每个 Section 基于视口位置的动画</p>
        </div>
        
        {[0, 1, 2, 3].map((i) => (
          <FeatureItem key={i} index={i} />
        ))}
      </div>
    </section>
  );
}

