"use client";

import { useEffect, useRef, useCallback } from "react";

// 配置
const DURATION = 4000; // 总持续时间 4 秒
const FADE_DURATION = 3000; // 淡出持续时间
const SCALE_DURATION = 1400; // 缩放动画持续时间
const SCALE_START = 0.3; // 初始缩放值

// 颜色配置 - 更丰富、鲜艳的庆祝色板 (iMessage 风格)
const COLORS = [
  "#ff3b30", // Red
  "#ff9500", // Orange
  "#ffcc00", // Yellow
  "#4cd964", // Green
  "#5ac8fa", // Light Blue
  "#007aff", // Blue
  "#5856d6", // Purple
  "#ff2d55", // Pink
];

// 粒子类型
interface Particle {
  x: number;
  y: number;
  wobble: number;
  wobbleSpeed: number;
  velocity: number;
  angle2D: number;
  tiltAngle: number;
  tiltAngleIncremental: number;
  color: string;
  shape: "circle" | "square" | "strip";
  depth: number;
  scale: number;
  drift: number;
  gravity: number;
  drag: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
}

// 辅助函数
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

export default function Confetti({ isActive, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  // 创建粒子
  const createParticle = (x: number, y: number): Particle => {
    const shapeType = Math.random();
    let shape: "circle" | "square" | "strip" = "strip";
    if (shapeType < 0.1) shape = "circle";
    else if (shapeType < 0.2) shape = "square";

    const depth = Math.random();
    const scale = 0.5 + depth * 0.8;
    const baseVelocity = randomInRange(15, 30);
    const velocity = baseVelocity * (0.8 + depth * 0.4);

    return {
      x,
      y,
      wobble: Math.random() * 10,
      wobbleSpeed: randomInRange(0.05, 0.1),
      velocity,
      angle2D: Math.PI / 2 + randomInRange(-0.2, 0.2),
      tiltAngle: Math.random() * Math.PI,
      tiltAngleIncremental: randomInRange(0.05, 0.12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape,
      depth,
      scale,
      drift: randomInRange(-1, 1),
      gravity: randomInRange(0.4, 0.7) * (0.8 + depth * 0.4),
      drag: 0.05,
      width: shape === "strip" ? randomInRange(6, 9) : randomInRange(10, 14),
      height: shape === "strip" ? randomInRange(20, 35) : randomInRange(10, 14),
      rotation: randomInRange(0, 360),
      rotationSpeed: randomInRange(-10, 10),
    };
  };

  // 动画循环
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 计算已过时间
    const elapsed = timestamp - startTimeRef.current;
    
    // 4秒后结束动画
    if (elapsed >= DURATION) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onComplete) onComplete();
      return;
    }

    // 计算全局淡出透明度 (最后淡出)
    let globalOpacity = 1;
    if (elapsed > DURATION - FADE_DURATION) {
      globalOpacity = (DURATION - elapsed) / FADE_DURATION;
    }

    // 计算扩散系数 (从 SCALE_START 过渡到 1)
    // 只影响 X 轴扩散和粒子大小，不影响 Y 轴位置
    let spreadFactor = 1;
    if (elapsed < SCALE_DURATION) {
      const t = elapsed / SCALE_DURATION;
      const easeOut = 1 - Math.pow(1 - t, 3);
      spreadFactor = SCALE_START + easeOut * (1 - SCALE_START);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 1. 物理更新
      p.wobble += p.wobbleSpeed;
      p.x += Math.cos(p.wobble) * 1 + p.drift;
      p.y += p.velocity + p.gravity;
      p.velocity *= 0.992;
      p.tiltAngle += p.tiltAngleIncremental;
      p.rotation += p.rotationSpeed;

      if (p.y > canvas.height + 50) {
        continue;
      }

      // 2. 绘制
      const rgb = hexToRgb(p.color);
      if (!rgb) continue;

      // 深度透明度 + 全局淡出
      const depthOpacity = 0.8 + p.depth * 0.2;
      const finalOpacity = depthOpacity * globalOpacity;
      
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalOpacity})`;

      // 计算扩散后的 X 位置（相对于中心的偏移量进行缩放）
      // Y 位置保持不变，确保彩带始终从屏幕外落下
      const offsetX = p.x - centerX;
      const spreadX = centerX + offsetX * spreadFactor;

      ctx.save();
      ctx.translate(spreadX, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      // 粒子大小也随扩散系数变化
      const currentScale = p.scale * spreadFactor;
      const tiltScale = Math.cos(p.tiltAngle) * currentScale;
      const scaleX = currentScale;

      ctx.beginPath();

      if (p.shape === "circle") {
        ctx.scale(scaleX, Math.abs(tiltScale));
        ctx.ellipse(0, 0, p.width / 2, p.width / 2, 0, 0, 2 * Math.PI);
      } else if (p.shape === "square") {
        ctx.scale(scaleX, Math.abs(tiltScale));
        ctx.rect(-p.width / 2, -p.width / 2, p.width, p.width);
      } else {
        ctx.scale(scaleX, Math.abs(tiltScale));
        ctx.rect(-p.width / 2, -p.height / 2, p.width, p.height);
      }

      ctx.fill();
      ctx.restore();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [onComplete]);

  // Handle Resize
  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    if (isActive && canvasRef.current) {
      handleResize();

      const width = window.innerWidth;
      const height = window.innerHeight;
      const newParticles: Particle[] = [];
      const totalParticles = 800;

      for (let i = 0; i < totalParticles; i++) {
        const x = Math.random() * width;
        // 更集中的初始高度分布，大部分在屏幕上方不远处
        const y = -randomInRange(20, height * 0.8);
        newParticles.push(createParticle(x, y));
      }

      particlesRef.current = newParticles;
      startTimeRef.current = performance.now();

      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    } else {
      particlesRef.current = [];
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, animate, handleResize]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[9999] ${isActive ? "block" : "hidden"}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
