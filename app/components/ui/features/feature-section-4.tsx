'use client';

import Image from 'next/image';
import { CmdBox } from '@/app/components/ui/features/cmdbox';

interface FeatureSection4Props {
    scrollProgress: number;
}

// 映射函数：将 value 从 [inMin, inMax] 映射到 [outMin, outMax]，并 clamp 到输出范围
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
    return outMin + t * (outMax - outMin);
}

const cards = [
    { id: 1, type: 'image', src: '/feature-section-4/1.webp' },
    { id: 2, type: 'image', src: '/feature-section-4/2.webp' },
    { id: 3, type: 'image', src: '/feature-section-4/3.webp' },
    { id: 4, type: 'cmdbox' },
] as const;

export function FeatureSection4({ scrollProgress }: FeatureSection4Props) {
    //progress1: 0 - 0.45 -> 0 - 1 用映射函数
    const progress1 = mapRange(scrollProgress, 0.2, 0.49, 0, 1);
    const progress2 = mapRange(scrollProgress, 0.49, 1, 0, 1);
    const height = 200;
    const width = height * 3 / 2+700*(1-progress1)

    return (
        <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
                perspective: `1200px`,
                perspectiveOrigin: 'center 10%'
            }}
        >
            {/* 卡片容器 - 3:2 比例 */}
            <div
                className="relative aspect-[3/2]"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transformStyle: 'preserve-3d',
                }}
            >
                {cards.map((card, index) => {
                    // 每张卡片的目标角度: 0°, 30°, 60°, 90°
                    const targetAngle = index * 30;
                    // 根据滚动进度计算当前角度
                    const currentAngle = 60 *(1 - progress1)+targetAngle*(1-progress1);

                    // z-index: 后面的卡片在下面
                    const zIndex = cards.length + index;

                    return (
                        <div
                            key={card.id}
                            className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
                            style={{
                                transformStyle: 'preserve-3d',
                                transformOrigin: 'center calc(100% + 100%)',
                                transform: `rotateX(${-currentAngle}deg)`,
                                zIndex,
                                backfaceVisibility: 'hidden',
                                willChange: 'transform',
                            }}
                        >
                            {card.type === 'image' ? (
                                <Image
                                    src={card.src}
                                    alt=""
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <CmdBox className="w-full" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
