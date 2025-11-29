'use client';

import { useEffect, useRef } from "react";

// 缓动系数配置

const SCROLL_EASING = 0.18;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    // 简单的惯性滚动实现
    // 核心原理：劫持 wheel 事件，累加 delta，然后通过 rAF 平滑 scrollTo
    
    const state = {
      target: 0,
      current: 0,
      isScrolling: false,
      rafId: 0
    };

    // 初始化
    state.target = window.scrollY;
    state.current = window.scrollY;

    const lerp = (start: number, end: number, t: number) => {
      return start * (1 - t) + end * t;
    };

    const update = () => {
      // 缓动系数，使用全局配置变量
      state.current = lerp(state.current, state.target, SCROLL_EASING);
      
      // 精度控制，避免无限计算
      if (Math.abs(state.target - state.current) < 0.5) {
        state.current = state.target;
        state.isScrolling = false;
        window.scrollTo(0, state.current);
        return; 
      }

      window.scrollTo(0, state.current);
      state.rafId = requestAnimationFrame(update);
    };

    const onWheel = (e: WheelEvent) => {
      // 阻止原生滚动
      e.preventDefault();

      // 计算最大滚动距离
      const maxScroll = document.body.scrollHeight - window.innerHeight;

      // 累加滚动距离 (e.deltaY)
      state.target += e.deltaY;

      // 边界限制
      state.target = Math.max(0, Math.min(state.target, maxScroll));

      // 如果没有在动画中，启动动画循环
      if (!state.isScrolling) {
        state.isScrolling = true;
        cancelAnimationFrame(state.rafId);
        state.rafId = requestAnimationFrame(update);
      }
    };

    // 使用 passive: false 才能阻止默认事件
    window.addEventListener("wheel", onWheel, { passive: false });
    
    // 处理窗口大小变化时的边界修正
    const onResize = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      state.target = Math.min(state.target, maxScroll);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(state.rafId);
    };
  }, []);

  return <>{children}</>;
}
