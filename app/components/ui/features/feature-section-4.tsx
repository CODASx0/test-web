'use client';

import Image from 'next/image';
import { CmdBox } from '@/app/components/ui/features/cmdbox';
import { motion, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface FeatureSection4Props {
    scrollProgress: number;
}


// ===== 全局缩放配置（triggerPoint 触发方式）=====
const globalScale = {
    triggerPoint: 0.40,   // 触发缩放的 scrollProgress 值
    scaleFrom: 2,       // 动画前缩放值
    scaleTo: 2,         // 动画后缩放值
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

// 设计稿配置（与 Section2 保持一致）
const designConfig = {
    designWidth: 1500,
    designHeight: 1000,
};

// ===== 卡片动画状态类型 =====
type CardAnimationState = {
    width: number;           // 宽度（设计稿坐标）
    height: number;          // 高度（设计稿坐标）
    opacity?: number;        // 不透明度（0-1）
    blur?: number;           // 模糊值（px）
};

// ===== 图片卡片配置 =====
const imageCardConfig = {
    from: {                  // 动画前状态
        width: 407,
        height: 118,
        opacity: 0,
        blur: 4,
    } as CardAnimationState,
    to: {                    // 动画后状态
        width: 407,
        height: 118,
        opacity: 1,
        blur: 0,
    } as CardAnimationState,
};

// ===== CmdBox 配置 =====
const cmdBoxConfig = {
    from: {                  // 动画前状态
        width: 409,
        height: 120,
        opacity: 0,
        blur: 24,
    } as CardAnimationState,
    to: {                    // 动画后状态
        width: 409,
        height: 120,
        opacity: 1,
        blur: 0,
    } as CardAnimationState,
};

// ===== Layer 视频配置（被 CmdBox 遮住的模糊光效）=====
const layerConfig = {
    src: '/layer.mp4',
    width: 297,              // 视频宽度（设计稿坐标）
    height: 116,             // 视频高度（设计稿坐标）
    blur: 30,                // 固定模糊值（px），不做动画
    opacityFrom: 0,
    opacityTo: 0.8,
};

// 图片卡片列表
const imageCards = [
    { id: 1, src: '/feature-section-4/1.webp' },
    { id: 2, src: '/feature-section-4/2.webp' },
    { id: 3, src: '/feature-section-4/3.webp' },
];

// 弹簧配置 - 不要太弹
const springTransition = {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 1,
    restDelta: 0.0001,   // 更小的阈值，避免提前 snap
    restSpeed: 0.0001,   // 更小的速度阈值
};

// 总卡片数（图片卡片 + CmdBox）
const totalCards = imageCards.length + 1;
// 每张卡片之间的延迟
const cardDelay = 0.12;

// ===== 第二阶段：堆叠动画配置 =====
const stackPhase = {
    triggerPoint: 0.4,       // 触发点
    baseScale: 0.85,         // 最后面卡片（先入场）的基础缩放值
    scaleStep: 0.05,         // 每张卡片往前缩放增加量
    offsetY: -15,            // 每张卡片向后位移量（px，负值向上）
    delay: 0.06,             // 每张卡片之间的延迟
}

export function FeatureSection4({ scrollProgress }: FeatureSection4Props) {
    // 全局缩放触发判断
    const isScaleTriggered = scrollProgress >= globalScale.triggerPoint;

    // 第一阶段：卡片展开动画触发点
    const triggerPoint = 0.3;
    const isTriggered = scrollProgress >= triggerPoint;

    // 第二阶段：堆叠动画触发点
    const isStackTriggered = scrollProgress >= stackPhase.triggerPoint;

    // 容器 ref 和缩放比例
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerScale, setContainerScale] = useState(1);

    // 监听容器尺寸变化，计算缩放比例
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateScale = () => {
            const width = container.offsetWidth;
            // 根据容器实际宽度计算缩放比例（设计稿宽度 1500）
            setContainerScale(width / designConfig.designWidth);
        };

        updateScale();

        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // 计算最终的卡片缩放值 = 容器缩放 × 全局缩放
    const targetGlobalScale = isScaleTriggered ? globalScale.scaleTo : globalScale.scaleFrom;

    // 使用 spring 动画 zoom 值，保持文字清晰
    const zoomSpring = useSpring(containerScale * globalScale.scaleFrom, {
        stiffness: globalScaleTransition.stiffness,
        damping: globalScaleTransition.damping,
        mass: globalScaleTransition.mass,
        restDelta: globalScaleTransition.restDelta,
        restSpeed: globalScaleTransition.restSpeed,
    });

    // 当目标值变化时更新 spring
    useEffect(() => {
        zoomSpring.set(containerScale * targetGlobalScale);
    }, [containerScale, targetGlobalScale, zoomSpring]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative flex items-center justify-center overflow-hidden"
            style={{
                perspective: `1200px`,
                perspectiveOrigin: 'center 10%',
                // 使用 clip-path 强制裁剪
                clipPath: 'inset(0 round var(--section-border-radius, 0px))',
            }}
        >
            {/* 卡片容器 - 使用 to 状态的宽高作为基准 */}
            <motion.div
                className="relative"
                style={{
                    width: imageCardConfig.to.width,
                    height: imageCardConfig.to.height,
                    transformOrigin: 'center center',
                    transformStyle: 'preserve-3d',
                    // 使用 zoom 代替 scale，文字会保持清晰
                    zoom: zoomSpring,
                }}
            >
                {/* 图片卡片 */}
                {imageCards.map((card, index) => {
                    // 每张卡片的目标角度: 0°, 30°, 60°, 90°
                    const targetAngle = index * 18
                    const currentAngle = isTriggered ? 0 : -(18 + targetAngle);
                    // 图片卡片 z-index：后入场的在上面（index 大的 z-index 大）
                    // 始终低于 CmdBox（CmdBox z-index = 100）
                    const zIndex = index + 1;

                    // 图片卡片动画状态
                    const imgFrom = imageCardConfig.from;
                    const imgTo = imageCardConfig.to;

                    // 第一阶段延迟
                    const forwardDelay = index * cardDelay;
                    const reverseDelay = (totalCards - 1 - index) * cardDelay;
                    const phase1Delay = isTriggered ? forwardDelay : reverseDelay;

                    // 第二阶段延迟（后入场的先动画，即 index 从大到小）
                    // index=2 先动画（delay=0），index=1 次之，index=0 最后
                    const reverseIndex = imageCards.length - 1 - index;
                    const stackForwardDelay = reverseIndex * stackPhase.delay;
                    const stackReverseDelay = index * stackPhase.delay;
                    const phase2Delay = isStackTriggered ? stackForwardDelay : stackReverseDelay;

                    // 综合延迟
                    const delay = isStackTriggered ? phase2Delay : phase1Delay;

                    // 容器基准尺寸
                    const containerWidth = imageCardConfig.to.width;
                    const containerHeight = imageCardConfig.to.height;

                    // 第二阶段：堆叠效果计算
                    // 先入场的图片（index 小）在最后面，缩放更小，位移更多
                    // 后入场的图片（index 大）在最前面，缩放更大，位移更少
                    // index=0 (图片1): 最后面, scale=0.85, offsetY=-45px
                    // index=1 (图片2): 中间, scale=0.90, offsetY=-30px
                    // index=2 (图片3): 最前面, scale=0.95, offsetY=-15px
                    const stackScale = stackPhase.baseScale + index * stackPhase.scaleStep;
                    const stackOffsetY = (reverseIndex + 1) * stackPhase.offsetY;

                    // 第一阶段目标宽高
                    const phase1Width = isTriggered ? imgTo.width : imgFrom.width;
                    const phase1Height = isTriggered ? imgTo.height : imgFrom.height;

                    // 最终目标值
                    const finalWidth = phase1Width;
                    const finalHeight = phase1Height;
                    const finalLeft = (containerWidth - finalWidth) / 2;
                    const baseTop = (containerHeight - finalHeight) / 2;
                    const finalTop = isStackTriggered ? baseTop + stackOffsetY : baseTop;
                    const finalScale = isStackTriggered ? stackScale : 1;
                    const finalOpacity = isTriggered ? (imgTo.opacity ?? 1) : (imgFrom.opacity ?? 1);

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute rounded-2xl overflow-hidden bg-white"
                            initial={{
                                width: imgFrom.width,
                                height: imgFrom.height,
                                left: (containerWidth - imgFrom.width) / 2,
                                top: (containerHeight - imgFrom.height) / 2,
                                scale: 1,
                                opacity: imgFrom.opacity ?? 1,
                                filter: imgFrom.blur ? `blur(${imgFrom.blur}px)` : 'none',
                            }}
                            animate={{
                                width: finalWidth,
                                height: finalHeight,
                                left: finalLeft,
                                top: finalTop,
                                scale: finalScale,
                                rotateX: currentAngle,
                                opacity: finalOpacity,
                                filter: isTriggered
                                    ? (imgTo.blur ? `blur(${imgTo.blur}px)` : 'none')
                                    : (imgFrom.blur ? `blur(${imgFrom.blur}px)` : 'none'),
                            }}
                            transition={{
                                ...springTransition,
                                delay,
                            }}
                            style={{
                                transformStyle: 'preserve-3d',
                                transformOrigin: 'center calc(100% + 50%)',
                                zIndex,
                                backfaceVisibility: 'hidden',
                                willChange: 'transform',
                            }}
                        >
                            <Image
                                src={card.src}
                                alt=""
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                    );
                })}

                {/* Layer 视频层（在 CmdBox 下方，被 CmdBox 遮住）*/}
                {(() => {
                    const containerWidth = imageCardConfig.to.width;
                    const containerHeight = imageCardConfig.to.height;

                    // 位置：和 CmdBox 相同位置（居中）
                    const layerLeft = (containerWidth - layerConfig.width) / 2;
                    const layerTop = (containerHeight - layerConfig.height) / 2;

                    return (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                width: layerConfig.width,
                                height: layerConfig.height,
                                left: layerLeft,
                                top: layerTop,
                                zIndex: 99,
                                // 固定 blur，不做动画
                                filter: `blur(${layerConfig.blur}px)`,
                                // 只动画 opacity
                                opacity: isTriggered ? layerConfig.opacityTo : layerConfig.opacityFrom,
                                transition: 'opacity 0.8s ease-out',
                            }}
                        >
                            <div className="h-full w-full overflow-hidden">
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                >
                                    <source src={layerConfig.src} type="video/mp4" />
                                </video>
                            </div>
                        </div>
                    );
                })()}

                {/* CmdBox 卡片 */}
                {(() => {
                    const cmdIndex = imageCards.length;
                    // 与图片卡片统一的旋转角度计算
                    const targetAngle = cmdIndex * 18;
                    const currentAngle = isTriggered ? 0 : -(18 + targetAngle);
                    // CmdBox 始终在最顶层
                    const zIndex = 100;

                    // CmdBox 动画状态
                    const cmdFrom = cmdBoxConfig.from;
                    const cmdTo = cmdBoxConfig.to;

                    // 正向延迟：最后一个
                    // 反向延迟：第一个（0）
                    const forwardDelay = cmdIndex * cardDelay;
                    const reverseDelay = (totalCards - 1 - cmdIndex) * cardDelay;
                    const delay = isTriggered ? forwardDelay : reverseDelay;

                    // 容器基准尺寸
                    const containerWidth = imageCardConfig.to.width;
                    const containerHeight = imageCardConfig.to.height;

                    return (
                        <motion.div
                            className="absolute rounded-2xl overflow-hidden bg-white"
                            initial={{
                                width: cmdFrom.width,
                                height: cmdFrom.height,
                                left: (containerWidth - cmdFrom.width) / 2,
                                top: (containerHeight - cmdFrom.height) / 2,
                                opacity: cmdFrom.opacity ?? 1,
                                filter: cmdFrom.blur ? `blur(${cmdFrom.blur}px)` : 'none',
                            }}
                            animate={{
                                width: isTriggered ? cmdTo.width : cmdFrom.width,
                                height: isTriggered ? cmdTo.height : cmdFrom.height,
                                left: isTriggered
                                    ? (containerWidth - cmdTo.width) / 2
                                    : (containerWidth - cmdFrom.width) / 2,
                                top: isTriggered
                                    ? (containerHeight - cmdTo.height) / 2
                                    : (containerHeight - cmdFrom.height) / 2,
                                rotateX: currentAngle,
                                opacity: isTriggered ? (cmdTo.opacity ?? 1) : (cmdFrom.opacity ?? 0),
                                filter: isTriggered
                                    ? (cmdTo.blur ? `blur(${cmdTo.blur}px)` : 'none')
                                    : (cmdFrom.blur ? `blur(${cmdFrom.blur}px)` : 'none'),
                            }}
                            transition={{
                                ...springTransition,
                                delay,
                            }}
                            style={{
                                transformStyle: 'preserve-3d',
                                // 与图片卡片统一的旋转轴
                                transformOrigin: 'center calc(100% + 50%)',
                                zIndex,
                                backfaceVisibility: 'hidden',
                                willChange: 'transform',
                            }}
                        >
                            <CmdBox className="w-full h-full"
                                deletingSpeed={7}
                                typingSpeed={24}
                                pauseDuration={1600}
                                messages={[
                                    'Create a documentary-style video explaining what black holes are.',
                                    'Make an animated video in a 90s anime style about a cat who can talk.',
                                    'Create an energetic, 30-second video ad for a new energy drink.',
                                    'Create a sci-fi story video based on The Wandering Earth plot.'

                                ]} />
                        </motion.div>
                    );
                })()}
            </motion.div>
        </div>
    );
}
