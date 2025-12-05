'use client';

import { motion, useSpring } from 'framer-motion';
import Image from 'next/image';
import { CmdBox } from './cmdbox';
import { useRef, useState, useEffect } from 'react';

interface FeatureSection2Props {
    scrollProgress: number;
}

// ===== 全局缩放配置（triggerPoint 触发方式）=====
const globalScale = {
    triggerPoint: 0.51,   // 触发缩放的 scrollProgress 值
    scaleFrom: 1.4,      // 动画前缩放值
    scaleTo: 1.4,          // 动画后缩放值
};

// 全局缩放专用的 spring 配置（更平滑的结束）
const globalScaleTransition = {
    type: 'spring' as const,
    stiffness: 50,
    damping: 20,
    mass: 1,
    restDelta: 0.0001,   // 更小的阈值，避免提前 snap
    restSpeed: 0.0001,   // 更小的速度阈值
};

// ===== 图层类型定义 =====
// 锚点配置（相对坐标 0-1）
type AnchorPoint = { x: number; y: number };

// 图层动画状态配置
type LayerAnimationState = {
    topLeft?: AnchorPoint;      // 左上锚点（默认 {x:0, y:0}）
    bottomRight?: AnchorPoint;  // 右下锚点（默认 {x:1, y:1}）
    blur?: number;              // blur 系数（相对于容器宽度，如 0.2 表示 20% 宽度的模糊）
    opacity?: number;           // 不透明度（0-1）
};

type SingleLayer = {
    type?: 'single';
    id: string;
    src: string;
    triggerPoint: number;
    offsetY: number;
    // 可选的扩展动画配置
    from?: LayerAnimationState;  // 动画前状态
    to?: LayerAnimationState;    // 动画后状态
};

type MessageGroupLayer = {
    type: 'messageGroup';
    id: string;
    triggerPoint: number;    // 整组的默认触发点
    delay: number;           // 每个 message 之间的延迟（当 message 没有单独设置 triggerPoint 时使用）
    offsetY: number;
    opacityFrom?: number;    // 动画开始时的初始透明度（默认 0.5）
    messages: { 
        id: string; 
        src: string; 
        triggerPoint?: number;  // 可选：单独设置触发点，设置后忽略 delay
    }[];
};

type Layer = SingleLayer | MessageGroupLayer;

// ===== 图层配置 =====
const layers: Layer[] = [
    // 背景层（最底层）
    { id: 'bg-1', src: '/feature-section-2/F 2 - bg 1.png', triggerPoint: 0.4, offsetY: 0 ,
        from: {
            opacity: 0,
        },
        to: {
            opacity: 0.1,
        },
    },

    { 
        id: 'layer', 
        src: '/layer.mp4', 
        triggerPoint: 0.4, 
        offsetY: 0,
        from: {
            topLeft: { x: 1064/1500, y: 902/1000 },
            bottomRight: { x: (1064+407)/1500, y: (902+62)/1000 },
            //blur: 300/1500,  // 动画前的 blur（相对于容器宽度）
            opacity: 0,
        },
        to: {
            topLeft: { x: 1064/1500, y: 902/1000 },
            bottomRight: { x: (1064+407)/1500, y: (902+62)/1000 },
            blur: 24/1500,  // 动画后的 blur（相对于容器宽度）
            opacity: 0.8,
        },
    },
    
    
    
    // 时间线
    { id: 'timeline', src: '/feature-section-2/F 2 - timeline.webp', triggerPoint: 0.40, offsetY: 40 },
    
    // BGM
    { id: 'bgm', src: '/feature-section-2/F 2 - BGM.webp', triggerPoint: 0.49, offsetY: 6 },
];

// CmdBox 配置（基于 1500x1000 设计稿）
const cmdBoxConfig = {
    left: 1047+16,
    bottom: 28,                  // 目标 bottom（设计稿坐标）
    right: 28,
    stickyBottomPx: 80,          // sticky 时距离窗口底部的像素
    // 设计稿尺寸
    designWidth: 1500,
    designHeight: 1000,
};

// Spring 动画配置（用于图层入场动画）
const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 60,
    mass: 1,
};

// CmdBox 移动的 spring 配置
const cmdBoxSpringConfig = {
    stiffness: 200,
    damping: 30,
    mass: 1,
    restDelta: 0.001,
    restSpeed: 0.001,
};

// 判断是否为视频文件
const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
function isVideoFile(src: string): boolean {
    const ext = src.toLowerCase().split('.').pop();
    return ext ? videoExtensions.includes(`.${ext}`) : false;
}

// 默认动画状态
const defaultAnimationState: Required<LayerAnimationState> = {
    topLeft: { x: 0, y: 0 },
    bottomRight: { x: 1, y: 1 },
    blur: 0,
    opacity: 1,
};

// ===== 单图层组件 =====
interface AnimatedLayerProps {
    src: string;
    triggerPoint: number;
    offsetY: number;
    scrollProgress: number;
    zIndex: number;
    from?: LayerAnimationState;
    to?: LayerAnimationState;
}

function AnimatedLayer({ src, triggerPoint, offsetY, scrollProgress, zIndex, from, to }: AnimatedLayerProps) {
    const isTriggered = scrollProgress >= triggerPoint;
    const isVideo = isVideoFile(src);
    
    // 合并默认值
    const fromState = { ...defaultAnimationState, ...from };
    const toState = { ...defaultAnimationState, ...to };
    
    // 根据触发状态选择当前状态
    const currentState = isTriggered ? toState : fromState;
    
    // 计算位置和尺寸（基于锚点）
    const left = `${currentState.topLeft!.x * 100}%`;
    const top = `${currentState.topLeft!.y * 100}%`;
    const width = `${(currentState.bottomRight!.x - currentState.topLeft!.x) * 100}%`;
    const height = `${(currentState.bottomRight!.y - currentState.topLeft!.y) * 100}%`;
    
    // 是否有自定义锚点（非默认全屏）
    const hasCustomAnchors = from?.topLeft || from?.bottomRight || to?.topLeft || to?.bottomRight;

    // 是否有 blur 动画
    const hasBlurAnimation = (from?.blur ?? 0) > 0 || (to?.blur ?? 0) > 0;
    
    return (
        <motion.div
            className="absolute"
            initial={{ 
                y: offsetY, 
                opacity: 0,
                filter: fromState.blur > 0 ? `blur(${fromState.blur * 100}vw)` : 'none',
            }}
            animate={{
                y: isTriggered ? 0 : offsetY,
                opacity: isTriggered ? (toState.opacity ?? 1) : (from?.opacity ?? 0),
                filter: currentState.blur > 0 ? `blur(${currentState.blur * 100}vw)` : 'none',
                left: hasCustomAnchors ? left : undefined,
                top: hasCustomAnchors ? top : undefined,
                width: hasCustomAnchors ? width : undefined,
                height: hasCustomAnchors ? height : undefined,
            }}
            transition={springTransition}
            style={{ 
                zIndex,
                // 如果没有自定义锚点，使用 inset-0
                ...(hasCustomAnchors ? {} : { inset: 0 }),
                // 优化：只在有 blur 动画时启用 will-change filter
                willChange: hasBlurAnimation ? 'transform, filter' : 'transform',
            }}
        >
            {isVideo ? (
                <video
                    src={src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1600px) 100vw, 1600px"
                    priority={zIndex < 3}
                />
            )}
        </motion.div>
    );
}

// ===== Message 动画组组件 =====
interface MessageGroupProps {
    layer: MessageGroupLayer;
    scrollProgress: number;
    baseZIndex: number;
}

function MessageGroupLayers({ layer, scrollProgress, baseZIndex }: MessageGroupProps) {
    const { triggerPoint: groupTriggerPoint, delay, offsetY, messages, opacityFrom = 0.5 } = layer;

    return (
        <>
            {messages.map((message, index) => {
                // 如果 message 有单独的 triggerPoint，使用它；否则使用组的 triggerPoint
                const hasOwnTrigger = message.triggerPoint !== undefined;
                const isTriggered = hasOwnTrigger 
                    ? scrollProgress >= message.triggerPoint!
                    : scrollProgress >= groupTriggerPoint;
                
                // 有单独 triggerPoint 的 message 不使用 delay
                const itemDelay = hasOwnTrigger ? 0 : index * delay;
                
                // 正向动画（触发时）：使用 keyframes + delay
                // 反向动画（回滚时）：直接过渡到初始状态，无 delay
                const forwardTransition = {
                    y: {
                        ...springTransition,
                        delay: itemDelay,
                    },
                    opacity: {
                        delay: itemDelay,
                        duration: 0.4,
                        times: [0, 0.01, 1],
                        ease: 'easeOut' as const,
                    },
                };
                
                const reverseTransition = {
                    y: springTransition,
                    opacity: {
                        duration: 0.2,
                        ease: 'easeOut' as const,
                    },
                };
                
                return (
                    <motion.div
                        key={message.id}
                        className="absolute inset-0 will-change-transform"
                        initial={{ y: offsetY, opacity: 0 }}
                        animate={{
                            y: isTriggered ? 0 : offsetY,
                            opacity: isTriggered ? [0, opacityFrom, 1] : 0,
                        }}
                        transition={isTriggered ? forwardTransition : reverseTransition}
                        style={{ zIndex: baseZIndex + index }}
                    >
                        <Image
                            src={message.src}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 1600px) 100vw, 1600px"
                        />
                    </motion.div>
                );
            })}
        </>
    );
}

// 判断是否为 messageGroup 类型
function isMessageGroup(layer: Layer): layer is MessageGroupLayer {
    return layer.type === 'messageGroup';
}

export function FeatureSection2({ scrollProgress }: FeatureSection2Props) {
    // 全局缩放触发判断
    const isScaleTriggered = scrollProgress >= globalScale.triggerPoint;
    
    // 容器 ref 和缩放比例
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerScale, setContainerScale] = useState(1);
    const [containerRect, setContainerRect] = useState({ top: 0, height: 0 });
    
    // 监听容器尺寸变化，计算缩放比例
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const updateScale = () => {
            const width = container.offsetWidth;
            const rect = container.getBoundingClientRect();
            // 根据容器实际宽度计算缩放比例（设计稿宽度 1500）
            setContainerScale(width / cmdBoxConfig.designWidth);
            setContainerRect({ top: rect.top, height: rect.height });
        };
        
        updateScale();
        
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(container);
        
        // 滚动时也更新位置
        window.addEventListener('scroll', updateScale, { passive: true });
        
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('scroll', updateScale);
        };
    }, []);
    
    // 计算 CmdBox 的 bottom 值（设计稿坐标）
    // 实现 sticky 效果：CmdBox 固定在窗口底部 80px，直到到达目标位置
    const calculateCmdBoxBottom = () => {
        const { bottom: targetBottom, stickyBottomPx } = cmdBoxConfig;
        
        if (typeof window === 'undefined' || containerRect.height === 0) {
            return targetBottom;
        }
        
        const viewportHeight = window.innerHeight;
        const containerBottom = containerRect.top + containerRect.height;
        
        // 计算 sticky 位置：CmdBox 应该在视口底部 stickyBottomPx 的位置
        // 转换为相对于容器底部的距离（设计稿坐标）
        const stickyPosFromContainerBottom = containerBottom - (viewportHeight - stickyBottomPx);
        const stickyBottomInDesign = stickyPosFromContainerBottom / containerScale;
        
        // 取 sticky 位置和目标位置的最大值
        // 当 sticky 位置大于目标位置时，CmdBox 在 sticky 位置（固定在窗口底部）
        // 当 sticky 位置小于等于目标位置时，CmdBox 在目标位置
        return Math.max(stickyBottomInDesign, targetBottom);
    };
    
    const cmdBoxBottom = calculateCmdBoxBottom();
    
    // 使用 spring 平滑 CmdBox 的移动
    const cmdBoxBottomSpring = useSpring(cmdBoxBottom, cmdBoxSpringConfig);
    
    // 当目标值变化时更新 spring
    useEffect(() => {
        cmdBoxBottomSpring.set(cmdBoxBottom);
    }, [cmdBoxBottom, cmdBoxBottomSpring]);
    
    // 计算每个图层的 zIndex（messageGroup 会占用多个 zIndex）
    let currentZIndex = 0;

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full relative overflow-hidden"
            style={{ 
                // 使用 clip-path 强制裁剪，确保 blur 不会溢出圆角
                clipPath: 'inset(0 round var(--section-border-radius, 0px))',
            }}
        >
            {/* 全局缩放容器 - 以右上角为锚点，triggerPoint 触发 */}
            <motion.div
                className="absolute inset-0 will-change-transform"
                initial={{ scale: globalScale.scaleFrom }}
                animate={{ 
                    scale: isScaleTriggered ? globalScale.scaleTo : globalScale.scaleFrom,
                }}
                transition={globalScaleTransition}
                style={{ transformOrigin: 'bottom right' }}
            >
                {layers.map((layer) => {
                    const zIndex = currentZIndex;
                    
                    if (isMessageGroup(layer)) {
                        currentZIndex += layer.messages.length;
                        return (
                            <MessageGroupLayers
                                key={layer.id}
                                layer={layer}
                                scrollProgress={scrollProgress}
                                baseZIndex={zIndex}
                            />
                        );
                    } else {
                        currentZIndex += 1;
                        return (
                            <AnimatedLayer
                                key={layer.id}
                                src={layer.src}
                                triggerPoint={layer.triggerPoint}
                                offsetY={layer.offsetY}
                                scrollProgress={scrollProgress}
                                zIndex={zIndex}
                                from={layer.from}
                                to={layer.to}
                            />
                        );
                    }
                })}
                
                {/* CmdBox - 1500x1000 设计稿容器，使用 scale 缩放 */}
                <div 
                    className="absolute inset-0 overflow-visible"
                    style={{ zIndex: 100 }}
                >
                    {/* 固定 1500x1000 尺寸的设计稿容器，通过 scale 缩放到实际大小 */}
                    <div 
                        className="origin-top-left"
                        style={{
                            width: cmdBoxConfig.designWidth,
                            height: cmdBoxConfig.designHeight,
                            transform: `scale(${containerScale})`,
                        }}
                    >
                        <motion.div
                            className="absolute"
                            style={{
                                // 使用设计稿的像素坐标
                                left: cmdBoxConfig.left,
                                right: cmdBoxConfig.right,
                                bottom: cmdBoxBottomSpring,
                            }}
                        >
                            <CmdBox className="h-auto" messages={['Make the protagonist run faster!', 'Make the music more intense!']} />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
