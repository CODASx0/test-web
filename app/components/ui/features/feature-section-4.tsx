'use client';

import Image from 'next/image';
import { CmdBox } from '@/app/components/ui/features/cmdbox';

interface FeatureSection4Props {
    scrollProgress: number;
}

const cards = [
    { id: 1, type: 'image', src: '/feature-section-4/1.webp' },
    { id: 2, type: 'image', src: '/feature-section-4/2.webp' },
    { id: 3, type: 'image', src: '/feature-section-4/3.webp' },
    { id: 4, type: 'cmdbox' },
] as const;

export function FeatureSection4({ scrollProgress }: FeatureSection4Props) {
    const easedProgress = scrollProgress;

    return (
        <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
                perspective: '1200px',
                perspectiveOrigin: 'center 40%'
            }}
        >
            {/* 卡片容器 - 3:2 比例 */}
            <div
                className="relative aspect-[3/2]"
                style={{
                    width: '360px',
                    transformStyle: 'preserve-3d',
                }}
            >
                {cards.map((card, index) => {
                    // 每张卡片的目标角度: 0°, 30°, 60°, 90°
                    const targetAngle = index * 30;
                    // 根据滚动进度计算当前角度
                    const currentAngle = easedProgress * 120 * (5 - easedProgress) + targetAngle;

                    // z-index: 后面的卡片在下面
                    const zIndex = cards.length - index;

                    return (
                        <div
                            key={card.id}
                            className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
                            style={{
                                transformStyle: 'preserve-3d',
                                transformOrigin: 'center calc(100% + 200%)',
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
