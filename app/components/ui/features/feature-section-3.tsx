'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface FeatureSection3Props {
    scrollProgress: number;
}

// ===== 全局缩放配置（triggerPoint 触发方式）=====
const globalScale = {
    triggerPoint: 0.5,   // 触发缩放的 scrollProgress 值
    scaleFrom: 1,      // 动画前缩放值
    scaleTo: 1,          // 动画后缩放值
};

// 全局缩放专用的 spring 配置（更平滑的结束）
const globalScaleTransition = {
    type: 'spring' as const,
    stiffness: 80,
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

// ===== 图层配置（包含 messageGroup）=====
const layers: Layer[] = [
    // 背景层（最底层）
    //{ id: 'bg-1', src: '/feature-section-1/F 1 - bg 1.webp', triggerPoint: 0, offsetY: 0 },
    { id: 'main', src: '/F 3.png', triggerPoint: 0.36, offsetY: 50 ,from:{
        blur: 20/1500,
    },
    to: {
        blur: 0,
    },
},
    
    
];

// Spring 动画配置（用于图层入场动画）
const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 60,
    mass: 1,
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

    return (
        <motion.div
            className="absolute will-change-transform"
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

export function FeatureSection3({ scrollProgress }: FeatureSection3Props) {
    // 全局缩放触发判断
    const isScaleTriggered = scrollProgress >= globalScale.triggerPoint;
    
    // 计算每个图层的 zIndex（messageGroup 会占用多个 zIndex）
    let currentZIndex = 0;

    return (
        <div 
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
                style={{ transformOrigin: 'top right' }}
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
            </motion.div>
            
            
        </div>
    );
}
