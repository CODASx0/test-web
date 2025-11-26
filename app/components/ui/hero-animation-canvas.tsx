"use client"

import { useCallback, useEffect, useRef, useState, ChangeEvent } from "react"
import { Settings, Play, Circle, Download, X, Upload, RotateCcw, Plus, Trash2 } from "lucide-react"
import { clsx } from "clsx"

// --- 类型定义 ---

type AnimationType = "spring" | "bezier"
// 移除复杂的 DelayMode，默认使用 Linear
type DelayCurveType = "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring"
type EasingPreset = "linear" | "easeIn" | "easeOut" | "easeInOut" | "custom"

interface SpringParams {
  stiffness: number
  damping: number
  mass: number
}

interface BezierParams {
  duration: number
  x1: number
  y1: number
  x2: number
  y2: number
}

interface DelayParams {
  // 等待时间（毫秒）- 该阶段开始前的固定等待
  wait: number
  // 交错时间（毫秒）- 第一个和最后一个字符之间的时间差
  stagger: number
  // 曲线类型（决定延迟的时间分布）
  curve: DelayCurveType
  // 弹簧曲线参数（用于延迟分布，仅当 curve 为 spring 时有效）
  spring: SpringParams
  // 动画起始中心点 (0-1)，0=左边开始，0.5=中心向两边扩散，1=右边开始
  origin: number
}

interface AnimationStage {
  id: string
  targetValue: number
  type: AnimationType
  spring: SpringParams
  bezier: BezierParams
  bezierPreset: EasingPreset
  delay: DelayParams
}

interface PropertyTimeline {
  initialValue: number
  staticValue: number
  enabled: boolean
  stages: AnimationStage[]
}

interface AnimationConfig {
  // 画布基础
  canvasWidth: number
  canvasHeight: number
  scale: number
  
  // 字体排版
  text: string
  align: "left" | "center" | "right"
  fontFamily: string
  
  // 动画轨道
  opacity: PropertyTimeline
  weight: PropertyTimeline
  blur: PropertyTimeline
  fontSize: PropertyTimeline
  lineHeight: PropertyTimeline
  letterSpacing: PropertyTimeline
}

interface FrameData {
  dataUrl: string
  frameNumber: number
  timestamp: number
}

// --- 默认值 ---

const DEFAULT_SPRING: SpringParams = { stiffness: 60, damping: 20, mass: 1 }
const DEFAULT_BEZIER: BezierParams = { duration: 1000, x1: 0.42, y1: 0, x2: 0.58, y2: 1 }
const DEFAULT_DELAY: DelayParams = { 
  wait: 0,        
  stagger: 100,   
  curve: "linear",
  spring: { stiffness: 100, damping: 15, mass: 1 },
  origin: 0  // 默认从左边开始
}

const createStage = (target: number): AnimationStage => ({
  id: Math.random().toString(36).substr(2, 9),
  targetValue: target,
  type: "spring",
  spring: { ...DEFAULT_SPRING },
  bezier: { ...DEFAULT_BEZIER },
  bezierPreset: "easeInOut",
  delay: { ...DEFAULT_DELAY }
})

// --- 数学与物理引擎 ---

// 贝塞尔曲线估算 (简单版 cubic-bezier)
function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // 简化的 3次贝塞尔求解，实际生产中通常使用查表或牛顿迭代，这里简化处理
  // 对于 CSS 动画通常 t 就是 x，我们需要求 y
  // 这里直接使用近似公式，或者假设 t 线性映射 (不够精确但够用)
  // 为了准确性，我们使用一个简单的 easing 映射：
  // 实际应用中，直接用 ease-in-out 作为默认 fallback，后续可扩展完整 bezier 求解器
  const cx = 3 * p1x
  const bx = 3 * (p2x - p1x) - cx
  const ax = 1 - cx - bx
  const cy = 3 * p1y
  const by = 3 * (p2y - p1y) - cy
  const ay = 1 - cy - by
  
  // 求解 x(t) = time 比较复杂，这里简化为标准 EaseInOut 替代自定义 Bezier 以保证性能
  // 如果用户选择了 bezier，目前暂时使用标准的 ease-in-out 曲线
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// 延迟曲线映射函数 - 将归一化位置 (0-1) 映射到延迟系数 (0-1)
function applyDelayCurve(normalizedPos: number, curveType: DelayCurveType, springParams: SpringParams): number {
  if (normalizedPos <= 0) return 0
  if (normalizedPos >= 1) return 1
  
  switch (curveType) {
    case "linear":
      return normalizedPos
    case "easeIn":
      return normalizedPos * normalizedPos
    case "easeOut":
      return 1 - (1 - normalizedPos) * (1 - normalizedPos)
    case "easeInOut":
      return normalizedPos < 0.5 
        ? 2 * normalizedPos * normalizedPos 
        : 1 - Math.pow(-2 * normalizedPos + 2, 2) / 2
    case "spring":
      const { stiffness, damping, mass } = springParams
      const omega = Math.sqrt(stiffness / mass)
      const zeta = damping / (2 * Math.sqrt(stiffness * mass))
      const t = normalizedPos * 2 
      if (zeta < 1) {
        const omegaD = omega * Math.sqrt(1 - zeta * zeta)
        const decay = Math.exp(-zeta * omega * t)
        return 1 - decay * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t))
      } else {
        const decay = Math.exp(-omega * t)
        return 1 - decay * (1 + omega * t)
      }
    default:
      return normalizedPos
  }
}

// 计算字符在特定阶段的延迟时间
function calculateCharDelay(delay: DelayParams, charIndex: number, totalChars: number): number {
  const origin = delay.origin ?? 0
  const maxChars = Math.max(totalChars - 1, 1)
  
  // 计算字符相对于起始点的距离（归一化到 0-1）
  // origin=0: 从左边开始，距离就是 charIndex/maxChars
  // origin=0.5: 从中心开始，距离是到中心的距离 * 2（因为最远距离是0.5）
  // origin=1: 从右边开始，距离是 (maxChars - charIndex)/maxChars
  const charNormalized = charIndex / maxChars
  const distance = Math.abs(charNormalized - origin)
  
  // 归一化距离，使得最远的字符距离为1
  // 最远距离 = max(origin, 1 - origin)
  const maxDistance = Math.max(origin, 1 - origin)
  const normalizedDistance = maxDistance > 0 ? distance / maxDistance : 0
  
  // 应用延迟曲线映射
  const curvedPos = applyDelayCurve(normalizedDistance, delay.curve, delay.spring)
  
  // 计算最终延迟
  // 等待时间 + 曲线映射后的交错时间
  return delay.wait + curvedPos * delay.stagger
}

// --- 物理引擎 ---

function springValue(t: number, from: number, to: number, params: SpringParams): number {
  if (t <= 0) return from
  const delta = to - from
  const { stiffness, damping, mass } = params
  const omega = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  
  if (zeta < 1) {
    const omegaD = omega * Math.sqrt(1 - zeta * zeta)
    const decay = Math.exp(-zeta * omega * t)
    return to - delta * decay * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t))
  } else {
    const decay = Math.exp(-omega * t)
    return to - delta * decay * (1 + omega * t)
  }
}

// --- 可视化组件 ---

const SpringGraph = ({ params }: { params: SpringParams }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)

    // Config
    const duration = 3 // simulate 3s
    const steps = 100
    
    // Draw background grid
    ctx.beginPath()
    ctx.strokeStyle = "#f5f5f5"
    ctx.lineWidth = 1
    ctx.moveTo(0, height * 0.8) // Base line (0)
    ctx.lineTo(width, height * 0.8)
    ctx.moveTo(0, height * 0.2) // Target line (1)
    ctx.lineTo(width, height * 0.2)
    ctx.stroke()

    // Draw Curve
    ctx.beginPath()
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * duration
      const val = springValue(t, 0, 1, params)
      
      // Map t (0-3s) to x (0-width)
      const x = (i / steps) * width
      // Map val (approx 0-1, but can overshoot) to y
      const y = height * 0.8 - val * (height * 0.6)
      
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Fill area under curve
    ctx.lineTo(width, height * 0.8)
    ctx.lineTo(0, height * 0.8)
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
    ctx.fill()

  }, [params])

  return <canvas ref={canvasRef} width={240} height={80} className="w-full h-20 bg-white rounded border border-neutral-100" />
}

const BezierGraph = ({ params }: { params: BezierParams }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)
    
    const padding = 15
    const drawWidth = width - padding * 2
    const drawHeight = height - padding * 2
    
    const x = (v: number) => padding + v * drawWidth
    const y = (v: number) => height - (padding + v * drawHeight) // Invert Y

    // Draw Axis
    ctx.beginPath()
    ctx.strokeStyle = "#eee"
    ctx.setLineDash([])
    ctx.moveTo(x(0), y(0))
    ctx.lineTo(x(1), y(0)) // X Axis
    ctx.moveTo(x(0), y(0))
    ctx.lineTo(x(0), y(1)) // Y Axis
    ctx.stroke()
    
    // Draw 1,1 reference
    ctx.beginPath()
    ctx.strokeStyle = "#f5f5f5"
    ctx.setLineDash([4, 4])
    ctx.moveTo(x(0), y(1))
    ctx.lineTo(x(1), y(1))
    ctx.lineTo(x(1), y(0))
    ctx.stroke()
    
    // Draw Handles
    ctx.setLineDash([])
    ctx.strokeStyle = "#fbbf24" // Amber for handles
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x(0), y(0))
    ctx.lineTo(x(params.x1), y(params.y1))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x(1), y(1))
    ctx.lineTo(x(params.x2), y(params.y2))
    ctx.stroke()
    
    // Draw Points
    ctx.fillStyle = "#f59e0b"
    ctx.beginPath(); ctx.arc(x(params.x1), y(params.y1), 3, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(x(params.x2), y(params.y2), 3, 0, Math.PI*2); ctx.fill()

    // Draw Bezier Curve
    ctx.beginPath()
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.moveTo(x(0), y(0))
    ctx.bezierCurveTo(
        x(params.x1), y(params.y1),
        x(params.x2), y(params.y2),
        x(1), y(1)
    )
    ctx.stroke()

  }, [params])
  
  return <canvas ref={canvasRef} width={120} height={120} className="w-full h-auto bg-white rounded border border-neutral-100" />
}

const StaggerGraph = ({ curve, spring, origin = 0 }: { curve: DelayCurveType, spring: SpringParams, origin?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)
    
    const padding = 10
    const drawWidth = width - padding * 2
    const drawHeight = height - padding * 2

    // Draw Axis
    ctx.strokeStyle = "#eee"
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()
    
    // Draw origin indicator line
    const originX = padding + origin * drawWidth
    ctx.strokeStyle = "#f97316"
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(originX, padding)
    ctx.lineTo(originX, height - padding)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw Bars (to visualize discrete chars with origin-based delay)
    const totalChars = 20
    const barWidth = (drawWidth / totalChars) * 0.6
    const maxDistance = Math.max(origin, 1 - origin)
    
    for (let i = 0; i < totalChars; i++) {
        const charNormalized = i / (totalChars - 1)
        const distance = Math.abs(charNormalized - origin)
        const normalizedDistance = maxDistance > 0 ? distance / maxDistance : 0
        const val = applyDelayCurve(normalizedDistance, curve, spring)
        
        const barHeight = val * drawHeight
        const x = padding + (i / (totalChars - 1)) * drawWidth
        const y = height - padding - barHeight
        
        // 靠近origin的字符用橙色高亮
        const distFromOrigin = Math.abs(charNormalized - origin)
        const isNearOrigin = distFromOrigin < 0.1
        ctx.fillStyle = isNearOrigin ? "#f97316" : "#3b82f6"
        ctx.fillRect(x - barWidth/2, y, barWidth, barHeight)
    }

  }, [curve, spring, origin])

  return <canvas ref={canvasRef} width={240} height={60} className="w-full h-16 bg-white rounded border border-neutral-100" />
}

// 计算弹簧的大致持续时间 (当振幅小于 0.001 时认为停止)
function estimateSpringDuration(params: SpringParams): number {
  const { stiffness, damping, mass } = params
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  const omega = Math.sqrt(stiffness / mass)
  // 经验公式：decay 衰减到 0.01 的时间
  // exp(-zeta * omega * t) = 0.01 => -zeta * omega * t = ln(0.01) ≈ -4.6
  // t = 4.6 / (zeta * omega)
  // 简化：t = 4.6 * 2 * mass / damping = 9.2 * mass / damping
  // 为了保险起见，在这个基础上增加一点
  // 注意：这是物理时间的秒数，我们需要毫秒
  if (damping === 0) return 5000 // 防止除零
  return (15 * mass / (damping / (2 * Math.sqrt(stiffness * mass)) * Math.sqrt(stiffness/mass))) * 1000 || 2000
}

// --- 核心组件 ---

export function HeroAnimationCanvas({ title: initialTitle }: { title: string }) {
  // --- 状态管理 ---
  const [config, setConfig] = useState<AnimationConfig>({
    canvasWidth: 800,
    canvasHeight: 450,
    scale: 2,
    text: initialTitle,
    align: "center",
    fontFamily: "Nohemi, system-ui, sans-serif",
    opacity: { initialValue: 0, staticValue: 100, enabled: true, stages: [createStage(100)] },
    weight: { initialValue: 100, staticValue: 400, enabled: true, stages: [createStage(600)] },
    blur: { initialValue: 16, staticValue: 0, enabled: true, stages: [createStage(0)] },
    fontSize: { initialValue: 60, staticValue: 60, enabled: true, stages: [] },
    lineHeight: { initialValue: 1.1, staticValue: 1.1, enabled: true, stages: [] },
    letterSpacing: { initialValue: 0, staticValue: 0, enabled: true, stages: [] }
  })

  // 调整 Blur 默认配置
  useEffect(() => {
    const defaultDelayOpacity: DelayParams = {
      wait: 0,
      stagger: 300,  // 10个字符 * 30ms
      curve: "linear",
      spring: { stiffness: 100, damping: 15, mass: 1 },
      origin: 0
    }
    const defaultDelayWeight: DelayParams = {
      wait: 0,
      stagger: 500,  // 10个字符 * 50ms
      curve: "linear",
      spring: { stiffness: 100, damping: 15, mass: 1 },
      origin: 0
    }
    const defaultDelayBlur: DelayParams = {
      wait: 0,
      stagger: 300,  // 10个字符 * 30ms
      curve: "linear",
      spring: { stiffness: 100, damping: 15, mass: 1 },
      origin: 0
    }
    
    setConfig(prev => ({
      ...prev,
      // 默认 Opacity 动画 (百分比 0-100)
      opacity: {
        initialValue: 0,
        staticValue: 100,
        enabled: true,
        stages: [{ ...createStage(100), delay: defaultDelayOpacity, spring: { stiffness: 50, damping: 20, mass: 1 } }]
      },
      // 默认 Weight 动画
      weight: {
        initialValue: 100,
        staticValue: 400,
        enabled: true,
        stages: [{ ...createStage(600), delay: defaultDelayWeight, spring: { stiffness: 50, damping: 30, mass: 1 } }]
      },
      // 默认 Blur 动画
      blur: {
        initialValue: 16,
        staticValue: 0,
        enabled: true,
        stages: [{ ...createStage(0), delay: defaultDelayBlur, spring: { stiffness: 60, damping: 20, mass: 1 } }]
      }
    }))
  }, [])

  const [activeTab, setActiveTab] = useState<"settings" | "animation">("animation")
  const [animSubTab, setAnimSubTab] = useState<"opacity" | "weight" | "blur" | "fontSize" | "lineHeight" | "letterSpacing">("opacity")
  const [showSettings, setShowSettings] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(3000)
  
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  const recordingRef = useRef(false)
  const [recordedFrames, setRecordedFrames] = useState<FrameData[]>([])
  const [fontLoaded, setFontLoaded] = useState(false)

  // --- 渲染引擎逻辑 ---

  // 获取某个属性在特定时间点的值
  // 核心逻辑：每个字符独立维护时间轨道，阶段之间串行执行
  // 阶段N的开始时间 = 该字符阶段N-1的结束时间 + 阶段N的延迟
  const getPropertyValue = useCallback((timeline: PropertyTimeline, charIndex: number, totalChars: number, elapsed: number) => {
    if (!timeline.enabled) return timeline.staticValue
    
    let currentValue = timeline.initialValue
    // 该字符已完成的时间基准点（上一阶段结束的时间）
    let charPreviousStageEndTime = 0

    for (const stage of timeline.stages) {
      // 计算该字符在该阶段的延迟时间
      // 这个延迟是相对于上一阶段结束后的等待时间
      const charDelay = calculateCharDelay(stage.delay, charIndex, totalChars)
      
      // 该阶段对于该字符的开始时间 = 上一阶段结束时间 + 该阶段的延迟
      const stageStartTime = charPreviousStageEndTime + charDelay
      
      // 计算该阶段内的本地时间（秒）
      const localT = (elapsed - stageStartTime) / 1000

      // 如果还没到这个阶段的开始时间，停留在上一个值
      if (localT < 0) {
        return currentValue 
      }

      // 计算该阶段的动画持续时间
      let stageDuration = 0 // ms
      if (stage.type === "bezier") {
        stageDuration = stage.bezier.duration
      } else {
        stageDuration = estimateSpringDuration(stage.spring)
      }

      // 如果在这个阶段的时间窗口内（动画正在进行中）
      if (elapsed < stageStartTime + stageDuration) {
        if (stage.type === "bezier") {
          const progress = Math.min(localT * 1000 / stage.bezier.duration, 1)
          const eased = cubicBezier(progress, stage.bezier.x1, stage.bezier.y1, stage.bezier.x2, stage.bezier.y2)
          return currentValue + (stage.targetValue - currentValue) * eased
        } else {
          return springValue(localT, currentValue, stage.targetValue, stage.spring)
        }
      }

      // 阶段结束，更新基准值
      currentValue = stage.targetValue
      
      // 更新该字符的阶段结束时间基准点
      // 下一阶段将基于这个时间点来计算开始时间
      charPreviousStageEndTime = stageStartTime + stageDuration
    }

    return currentValue
  }, [])

  const render = useCallback((ctx: CanvasRenderingContext2D, elapsed: number) => {
    const { canvasWidth, canvasHeight, scale, text, align, fontFamily } = config
    const width = canvasWidth * scale
    const height = canvasHeight * scale

    ctx.clearRect(0, 0, width, height)
    ctx.textBaseline = "middle"
    ctx.textAlign = "left"

    const lines = text.split("\n")
    
    let globalCharIndex = 0
    const totalChars = text.replace(/\n/g, "").length

    // 1. 预计算每个字符的布局信息
    const linesWithLayout = lines.map(line => {
      const charsLayout = line.split("").map(char => {
        const currentWeight = getPropertyValue(config.weight, globalCharIndex, totalChars, elapsed)
        const currentOpacity = getPropertyValue(config.opacity, globalCharIndex, totalChars, elapsed)
        const currentBlur = getPropertyValue(config.blur, globalCharIndex, totalChars, elapsed)
        
        // 新增属性
        const currentFontSize = getPropertyValue(config.fontSize, globalCharIndex, totalChars, elapsed)
        const currentLetterSpacing = getPropertyValue(config.letterSpacing, globalCharIndex, totalChars, elapsed)
        const currentLineHeight = getPropertyValue(config.lineHeight, globalCharIndex, totalChars, elapsed)
        
        globalCharIndex++

        // 使用当前字号和字重测量宽度（保留1位小数以获得平滑过渡）
        ctx.font = `${currentWeight.toFixed(1)} ${currentFontSize * scale}px ${fontFamily}`
        const charWidth = ctx.measureText(char).width
        
        return {
          char,
          width: charWidth,
          weight: currentWeight,
          opacity: currentOpacity,
          blur: currentBlur,
          fontSize: currentFontSize,
          letterSpacing: currentLetterSpacing,
          lineHeight: currentLineHeight
        }
      })

      // 计算当前行的总宽度
      let lineWidth = charsLayout.reduce((sum, c) => sum + c.width, 0)
      // 加上字间距
      if (charsLayout.length > 1) {
        // 累加前 n-1 个字符的 letterSpacing
        lineWidth += charsLayout.slice(0, -1).reduce((sum, c) => sum + c.letterSpacing * scale, 0)
      }
      
      // 计算该行的最大行高（实际高度像素值）
      // 如果行是空的，使用 config.fontSize 的初始值作为默认高度? 
      // 或者默认给一个高度。为了防止空行高度为0，使用 initialValue。
      const fallbackHeight = config.fontSize.initialValue * config.lineHeight.initialValue * scale
      const maxLineHeightPx = charsLayout.length > 0 
        ? charsLayout.reduce((max, c) => Math.max(max, c.fontSize * c.lineHeight * scale), 0) 
        : fallbackHeight

      return { chars: charsLayout, width: lineWidth, height: maxLineHeightPx }
    })

    // 计算总高度
    const totalHeight = linesWithLayout.reduce((sum, line) => sum + line.height, 0)
    
    // 垂直居中起始 Y
    let currentY = (height - totalHeight) / 2

    // 2. 绘制
    linesWithLayout.forEach((lineLayout) => {
      const lineCenterY = currentY + lineLayout.height / 2
      
      // 根据对齐方式确定起始 X
      let cursorX = 0
      if (align === "center") cursorX = (width - lineLayout.width) / 2
      else if (align === "right") cursorX = width - lineLayout.width - 50 * scale
      else cursorX = 50 * scale

      lineLayout.chars.forEach((charInfo, idx) => {
        // 设置绘制属性
        ctx.font = `${charInfo.weight.toFixed(1)} ${charInfo.fontSize * scale}px ${fontFamily}`
        
        if (charInfo.blur > 0.5) {
          ctx.filter = `blur(${charInfo.blur * scale}px)`
        } else {
          ctx.filter = "none"
        }

        ctx.fillStyle = `rgba(15, 15, 15, ${Math.max(0, Math.min(1, charInfo.opacity / 100))})`
        
        // 绘制字符
        ctx.fillText(charInfo.char, cursorX, lineCenterY)

        // 移动光标
        cursorX += charInfo.width
        if (idx < lineLayout.chars.length - 1) {
             cursorX += charInfo.letterSpacing * scale
        }
      })
      
      currentY += lineLayout.height
    })
    
    ctx.filter = "none"
  }, [config, getPropertyValue])

  // --- 动画循环与控制 ---

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === 0) startTimeRef.current = timestamp
    const elapsed = timestamp - startTimeRef.current
    
    setProgress(Math.min((elapsed / duration) * 100, 100))
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      render(ctx, elapsed)
      
      if (recordingRef.current) {
        setRecordedFrames(prev => [...prev, {
          dataUrl: canvas.toDataURL("image/png"),
          frameNumber: frameCountRef.current++,
          timestamp: elapsed
        }])
      }
    }

    if (elapsed < duration) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      setIsPlaying(false)
      if (recordingRef.current) {
        setIsRecording(false)
        recordingRef.current = false
      }
    }
  }, [render, duration])

  const startAnimation = useCallback(() => {
    startTimeRef.current = 0
    cancelAnimationFrame(animationRef.current)
    setIsPlaying(true)
    animationRef.current = requestAnimationFrame(animate)
  }, [animate])

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setProgress(val)
    if (isPlaying) {
      setIsPlaying(false)
      cancelAnimationFrame(animationRef.current)
    }
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (ctx) render(ctx, (val / 100) * duration)
  }

  const startRecording = () => {
    if (isRecording) {
      // 如果正在录制，停止录制
      setIsRecording(false)
      recordingRef.current = false
      setIsPlaying(false)
      cancelAnimationFrame(animationRef.current)
      return
    }
    
    // 如果正在播放，先停止播放
    if (isPlaying) {
      setIsPlaying(false)
      cancelAnimationFrame(animationRef.current)
    }
    
    // 重置进度条到开头
    setProgress(0)
    startTimeRef.current = 0
    
    // 清空已录制的帧
    setRecordedFrames([])
    frameCountRef.current = 0
    
    // 开始录制
    setIsRecording(true)
    recordingRef.current = true
    startAnimation()
  }

  // 初始化 & 预览刷新
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    canvas.width = config.canvasWidth * config.scale
    canvas.height = config.canvasHeight * config.scale

    // 静态预览渲染最后一帧 (100s)
    if (!isPlaying && !isRecording) {
      render(ctx, 100000)
    }
  }, [config, isPlaying, isRecording, render])

  // 估算总时长
  useEffect(() => {
    // 简单估算：最长的 Timeline
    const calcDuration = (tl: PropertyTimeline) => {
      let t = 0
      tl.stages.forEach(s => {
        // 新的延迟结构：等待时间 + 交错时间（即最后一个字符的延迟）
        const maxDelay = s.delay.wait + s.delay.stagger
        const animTime = s.type === "bezier" ? s.bezier.duration : estimateSpringDuration(s.spring)
        t += maxDelay + animTime
      })
      return t
    }
    const maxD = Math.max(
      calcDuration(config.opacity), 
      calcDuration(config.weight), 
      calcDuration(config.blur),
      calcDuration(config.fontSize),
      calcDuration(config.lineHeight),
      calcDuration(config.letterSpacing)
    )
    setDuration(maxD + 1000) // buffer
  }, [config])

  // 字体加载检测
  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        // 获取真实字体名逻辑略...直接使用 config
        setFontLoaded(true)
        setTimeout(startAnimation, 500)
      })
    }
  }, []) // eslint-disable-line

  // 导出
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadJSZip = useCallback(async (): Promise<any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).JSZip) return (window as any).JSZip
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
      script.onload = () => resolve((window as any).JSZip)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }, [])

  const exportFrames = async () => {
    if (recordedFrames.length === 0) return
    try {
      const JSZip = await loadJSZip()
      const zip = new JSZip()
      const frames = zip.folder("frames")
      recordedFrames.forEach(f => {
        frames.file(`frame_${String(f.frameNumber).padStart(4, "0")}.png`, f.dataUrl.split(",")[1], {base64:true})
      })
      const content = await zip.generateAsync({type:"blob"})
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url; a.download = "frames.zip"; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("导出失败")
    }
  }

  const handleFontUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const fontName = `CustomFont-${Date.now()}`
      const fontFace = new FontFace(fontName, buffer)
      await fontFace.load()
      document.fonts.add(fontFace)
      setConfig(prev => ({ ...prev, fontFamily: fontName }))
      alert("字体加载成功")
    } catch (e) { console.error(e); alert("加载失败") }
  }

  // --- UI 辅助函数 ---
  const updateTimeline = (key: "opacity" | "weight" | "blur" | "fontSize" | "lineHeight" | "letterSpacing", updater: (prev: PropertyTimeline) => PropertyTimeline) => {
    setConfig(prev => ({ ...prev, [key]: updater(prev[key]) }))
  }

  const updateStage = (key: "opacity" | "weight" | "blur" | "fontSize" | "lineHeight" | "letterSpacing", stageIndex: number, updater: (stage: AnimationStage) => AnimationStage) => {
    updateTimeline(key, tl => {
      const newStages = [...tl.stages]
      newStages[stageIndex] = updater(newStages[stageIndex])
      return { ...tl, stages: newStages }
    })
  }

  const addStage = (key: "opacity" | "weight" | "blur" | "fontSize" | "lineHeight" | "letterSpacing") => {
    updateTimeline(key, tl => ({
      ...tl,
      stages: [...tl.stages, createStage(tl.stages.length > 0 ? tl.stages[tl.stages.length - 1].targetValue : tl.initialValue)]
    }))
  }

  const removeStage = (key: "opacity" | "weight" | "blur" | "fontSize" | "lineHeight" | "letterSpacing", index: number) => {
    updateTimeline(key, tl => ({
      ...tl,
      stages: tl.stages.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-50" ref={containerRef}>
      {/* Title */}
      <div className="absolute top-0 left-0 p-4 z-20">
        <h2 className="text-xl font-semibold font-nohemi text-slate-900">VF Animation Render</h2>
      </div>

      {/* Canvas */}
      <div 
        className="relative shadow-2xl overflow-hidden border border-neutral-200/50 rounded-[32px]"
        style={{
          width: config.canvasWidth, height: config.canvasHeight,
          maxWidth: "90%", maxHeight: "80vh",
          aspectRatio: `${config.canvasWidth}/${config.canvasHeight}`,
          backgroundImage: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
          backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>

      {/* Controls */}
      <div className="absolute top-0 right-0 p-4 flex items-center gap-2 z-20">
        <div className="bg-white/90 backdrop-blur shadow-sm border border-neutral-200 rounded-lg p-1 flex items-center gap-3 pr-3">
          <button onClick={startAnimation} disabled={isRecording} className="p-2 hover:bg-neutral-100 rounded-md disabled:opacity-50">
            {isPlaying ? <RotateCcw size={20} /> : <Play size={20} />}
          </button>
          <input 
            type="range" min="0" max="100" step="0.1" value={progress} onChange={handleProgressChange}
            className="w-32 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
          <div className="w-px h-6 bg-neutral-200" />
          <button onClick={startRecording} className={clsx("p-2 rounded-md transition-colors", isRecording ? "text-red-500 bg-red-50/50" : "text-red-500 hover:bg-neutral-100")}>
            <div className="relative flex items-center justify-center w-5 h-5">
              {isRecording ? <div className="w-2.5 h-2.5 bg-current rounded-sm animate-pulse" /> : <Circle size={20} fill="currentColor" />}
            </div>
          </button>
          <button onClick={exportFrames} disabled={recordedFrames.length === 0 || isRecording} className="p-2 hover:bg-neutral-100 rounded-md disabled:opacity-50">
            <Download size={20} />
          </button>
          <div className="w-px h-6 bg-neutral-200" />
          <button onClick={() => setShowSettings(!showSettings)} className={clsx("p-2 hover:bg-neutral-100 rounded-md", showSettings && "bg-neutral-100")}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-96 bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xl rounded-xl flex flex-col z-30 max-h-[85vh]">
          <div className="flex justify-between items-center p-4 border-b border-neutral-100">
            <div className="flex gap-4 text-sm font-medium">
              <button onClick={() => setActiveTab("animation")} className={clsx("transition-colors", activeTab === "animation" ? "text-slate-900" : "text-slate-500")}>动画</button>
              <button onClick={() => setActiveTab("settings")} className={clsx("transition-colors", activeTab === "settings" ? "text-slate-900" : "text-slate-500")}>基础设置</button>
            </div>
            <button onClick={() => setShowSettings(false)}><X size={16} /></button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {activeTab === "settings" && (
              <div className="space-y-4 text-xs">
                {/* 文本内容 */}
                <div>
                  <label className="block mb-1 text-neutral-500">文本内容</label>
                  <textarea value={config.text} onChange={e => setConfig({...config, text: e.target.value})} className="w-full p-2 border rounded min-h-[80px]" />
                </div>
                
                {/* 对齐方式 */}
                <div>
                  <label className="block mb-1 text-neutral-500">对齐方式</label>
                  <div className="flex border rounded overflow-hidden">
                    {(["left", "center", "right"] as const).map(a => (
                      <button key={a} onClick={() => setConfig({...config, align: a})} className={clsx("flex-1 py-1.5 capitalize", config.align === a ? "bg-slate-900 text-white" : "hover:bg-neutral-50")}>{a}</button>
                    ))}
                  </div>
                </div>
                
                {/* 画布尺寸 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-neutral-500">画布宽度</label>
                    <input type="number" value={config.canvasWidth} onChange={e => setConfig({...config, canvasWidth: +e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">画布高度</label>
                    <input type="number" value={config.canvasHeight} onChange={e => setConfig({...config, canvasHeight: +e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                </div>
                
                {/* 渲染倍数 */}
                <div>
                  <label className="block mb-1 text-neutral-500">渲染倍数</label>
                  <select value={config.scale} onChange={e => setConfig({...config, scale: +e.target.value})} className="w-full p-2 border rounded bg-white">
                    <option value="1">1x (720p if base is HD)</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x (Retina)</option>
                    <option value="3">3x</option>
                    <option value="4">4x (8K)</option>
                  </select>
                </div>
                
                {/* 动画时长 */}
                <div>
                  <label className="block mb-1 text-neutral-500">动画时长 (ms)</label>
                  <input type="number" value={duration} onChange={e => setDuration(+e.target.value)} className="w-full p-2 border rounded" />
                </div>
                
                {/* 自定义字体 */}
                <div className="pt-2 border-t">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors">
                    <Upload size={14} /> <span>上传自定义字体 (.ttf/.woff2)</span>
                    <input type="file" hidden accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} />
                  </label>
                  <p className="text-[10px] text-neutral-400 mt-1">可变轴当前只支持一个 (wght)</p>
                </div>
              </div>
            )}

            {activeTab === "animation" && (
              <div className="space-y-4">
                {/* Animation Sub-tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
                  {(["opacity", "weight", "blur", "fontSize", "lineHeight", "letterSpacing"] as const).map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setAnimSubTab(tab)} 
                      className={clsx(
                        "py-1.5 rounded-md transition-all duration-200 capitalize", 
                        animSubTab === tab 
                          ? "bg-white shadow-sm text-slate-900 ring-1 ring-black/5" 
                          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50"
                      )}
                    >
                      {{
                        opacity: "透明度", weight: "字重", blur: "模糊",
                        fontSize: "字号", lineHeight: "行高", letterSpacing: "字距"
                      }[tab]}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* Initial Value & Toggle */}
                  <div className="bg-white rounded-xl border border-neutral-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-4 relative group hover:border-neutral-300 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={config[animSubTab].enabled} onChange={e => updateTimeline(animSubTab, tl => ({ ...tl, enabled: e.target.checked }))} />
                          <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                        <span className="text-xs font-medium text-neutral-600">初始值 (Initial)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={config[animSubTab].enabled ? config[animSubTab].initialValue : config[animSubTab].staticValue} 
                          onChange={e => updateTimeline(animSubTab, tl => ({ ...tl, [config[animSubTab].enabled ? 'initialValue' : 'staticValue']: +e.target.value }))}
                          className="w-20 px-2 py-1.5 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/20 transition-all bg-white text-right font-mono"
                        />
                        <span className="text-[10px] text-neutral-400 w-6">
                          {{ opacity: "%", weight: "", blur: "px", fontSize: "px", lineHeight: "", letterSpacing: "px" }[animSubTab]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {config[animSubTab].stages.map((stage, idx) => (
                      <div key={stage.id} className={clsx("bg-white rounded-xl border border-neutral-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-4 space-y-4 relative group hover:border-neutral-300 transition-colors", !config[animSubTab].enabled && "opacity-50 pointer-events-none")}>
                        <button onClick={() => removeStage(animSubTab, idx)} className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                        
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-900">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">{idx + 1}</div>
                            <span>目标值 (Target)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={stage.targetValue}
                              onChange={e => updateStage(animSubTab, idx, s => ({ ...s, targetValue: +e.target.value }))}
                              className="w-20 px-2 py-1.5 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/20 transition-all bg-white text-right font-mono"
                            />
                            <span className="text-[10px] text-neutral-400 w-6">
                              {{ opacity: "%", weight: "", blur: "px", fontSize: "px", lineHeight: "", letterSpacing: "px" }[animSubTab]}
                            </span>
                          </div>
                        </div>

                        {/* Animation Curve Settings */}
                        <div className="space-y-2">
                            <label className="text-neutral-400 block text-[10px] mb-1">动画曲线</label>
                            {/* Level 1: Spring vs Curve */}
                            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg">
                                {(["spring", "bezier"] as const).map(type => (
                                    <button 
                                        key={type} 
                                        onClick={() => updateStage(animSubTab, idx, s => ({ ...s, type }))} 
                                        className={clsx(
                                            "py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                                            stage.type === type ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50"
                                        )}
                                    >
                                        {type === "spring" ? "弹簧 (Spring)" : "曲线 (Curve)"}
                                    </button>
                                ))}
                            </div>
                            
                            {stage.type === "spring" ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      {(["stiffness", "damping", "mass"] as const).map(k => (
                                        <div key={k}>
                                          <label className="text-neutral-400 block text-[10px] mb-1 capitalize">{k}</label>
                                          <input 
                                            type="number" 
                                            value={stage.spring[k]} 
                                            onChange={e => updateStage(animSubTab, idx, s => ({ ...s, spring: { ...s.spring, [k]: +e.target.value } }))} 
                                            className="w-full px-2 py-1.5 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 transition-all bg-white" 
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="pt-1"><SpringGraph params={stage.spring} /></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Level 2: Curve Presets */}
                                    <div className="grid grid-cols-5 gap-1 p-1 bg-neutral-100 rounded-lg">
                                        {(["linear", "easeIn", "easeOut", "easeInOut", "custom"] as const).map(p => (
                                            <button 
                                                key={p} 
                                                onClick={() => updateStage(animSubTab, idx, s => {
                                                    const updates: Partial<AnimationStage> = { bezierPreset: p }
                                                    if (p !== "custom") {
                                                        const presets: Record<string, Omit<BezierParams, 'duration'>> = {
                                                            linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
                                                            easeIn: { x1: 0.42, y1: 0, x2: 1, y2: 1 },
                                                            easeOut: { x1: 0, y1: 0, x2: 0.58, y2: 1 },
                                                            easeInOut: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
                                                        }
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        if ((presets as any)[p]) {
                                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                            updates.bezier = { ...s.bezier, ...(presets as any)[p] }
                                                        }
                                                    }
                                                    return { ...s, ...updates }
                                                })} 
                                                className={clsx(
                                                    "py-1.5 rounded-md text-[10px] font-medium transition-all duration-200",
                                                    stage.bezierPreset === p ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50"
                                                )}
                                            >
                                                {p === "linear" ? "线性" : p === "easeIn" ? "渐入" : p === "easeOut" ? "渐出" : p === "easeInOut" ? "平滑" : "自定义"}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="flex gap-3 items-start">
                                        <div className="flex-1">
                                            <label className="text-neutral-400 block text-[10px] mb-1">时长 (ms)</label>
                                            <input type="number" value={stage.bezier.duration} onChange={e => updateStage(animSubTab, idx, s => ({ ...s, bezier: { ...s.bezier, duration: +e.target.value } }))} className="w-full px-2 py-1.5 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 transition-all bg-white" />
                                            
                                            {stage.bezierPreset === "custom" && (
                                                <div className="grid grid-cols-2 gap-1 mt-2">
                                                  {(["x1", "y1", "x2", "y2"] as const).map(k => (
                                                    <input 
                                                      key={k} 
                                                      type="number" 
                                                      step="0.1" 
                                                      value={stage.bezier[k]} 
                                                      onChange={e => updateStage(animSubTab, idx, s => ({ ...s, bezier: { ...s.bezier, [k]: +e.target.value } }))} 
                                                      className="w-full p-1 border rounded-md text-center focus:outline-none focus:border-neutral-400 transition-all bg-white"
                                                      placeholder={k}
                                                    />
                                                  ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-[100px] pt-4">
                                            <BezierGraph params={stage.bezier} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delay Settings */}
                        <div className="pt-3 border-t border-neutral-100 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-neutral-400 block text-[10px] mb-1">等待时间 (ms)</label>
                                  <input type="number" value={stage.delay.wait} onChange={e => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, wait: +e.target.value } }))} className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 transition-all bg-white" />
                                </div>
                                <div>
                                  <label className="text-neutral-400 block text-[10px] mb-1">阶段延迟总时间 (ms)</label>
                                  <input type="number" value={stage.delay.stagger} onChange={e => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, stagger: +e.target.value } }))} className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 transition-all bg-white" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-neutral-400 block text-[10px] mb-1.5">延迟开始时间映射</label>
                                <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg mb-2">
                                    <button onClick={() => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, curve: "linear" } }))} className={clsx("py-1.5 rounded-md text-xs font-medium transition-all duration-200", stage.delay.curve !== "spring" ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50")}>曲线分布</button>
                                    <button onClick={() => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, curve: "spring" } }))} className={clsx("py-1.5 rounded-md text-xs font-medium transition-all duration-200", stage.delay.curve === "spring" ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50")}>弹簧分布</button>
                                </div>
                                
                                {stage.delay.curve === "spring" ? (
                                    <div className="bg-neutral-50/50 rounded-lg p-3 space-y-3 border border-neutral-100">
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        {(["stiffness", "damping", "mass"] as const).map(k => (
                                          <div key={k}>
                                            <label className="text-neutral-400 block text-[10px] mb-1 capitalize">{k}</label>
                                            <input type="number" value={stage.delay.spring[k]} onChange={e => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, spring: { ...s.delay.spring, [k]: +e.target.value } } }))} className="w-full px-2 py-1.5 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 transition-all bg-white" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-lg">
                                      {(["linear", "easeIn", "easeOut", "easeInOut"] as const).map(c => (
                                        <button 
                                          key={c} 
                                          onClick={() => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, curve: c } }))}
                                          className={clsx("py-1.5 rounded-md text-[10px] font-medium transition-all duration-200", stage.delay.curve === c ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50")}
                                        >
                                          {c === "linear" ? "线性" : c === "easeIn" ? "渐入" : c === "easeOut" ? "渐出" : c === "easeInOut" ? "平滑" : ""}
                                        </button>
                                      ))}
                                    </div>
                                )}
                                
                                {/* Origin Slider */}
                                <div className="pt-3 mt-3 border-t border-neutral-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-neutral-400 text-[10px]">动画起始位置 <span className="text-orange-500">({config.text.replace(/\n/g, "").length} 字符)</span></label>
                                      <span className="text-[10px] font-mono text-neutral-500">{Math.round((stage.delay.origin ?? 0) * 100)}%</span>
                                    </div>
                                    <div className="relative">
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.01"
                                        value={stage.delay.origin ?? 0}
                                        onChange={e => updateStage(animSubTab, idx, s => ({ ...s, delay: { ...s.delay, origin: +e.target.value } }))}
                                        className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                                      />
                                      <div className="flex justify-between text-[9px] text-neutral-400 mt-1">
                                        <span>← 左</span>
                                        <span>中心</span>
                                        <span>右 →</span>
                                      </div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <StaggerGraph curve={stage.delay.curve} spring={stage.delay.spring} origin={stage.delay.origin ?? 0} />
                                </div>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => addStage(animSubTab)}
                    className="w-full py-3 border border-dashed border-neutral-300 rounded-xl text-xs text-neutral-500 hover:bg-neutral-50 hover:border-neutral-400 flex items-center justify-center gap-2 transition-all hover:shadow-sm"
                  >
                    <Plus size={14} /> 添加关键帧阶段
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
