'use client';

import Image from 'next/image';
import { CmdBox } from '@/app/components/ui/features/cmdbox';
import { motion } from 'framer-motion';

interface FeatureSection4Props {
    scrollProgress: number;
}

const cards = [
    { id: 1, type: 'image', src: '/feature-section-4/1.webp' },
    { id: 2, type: 'image', src: '/feature-section-4/2.webp' },
    { id: 3, type: 'image', src: '/feature-section-4/3.webp' },
    { id: 4, type: 'cmdbox' },
] as const;

// 弹簧配置 - 不要太弹
const springTransition = {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 1,
};

export function FeatureSection4({ scrollProgress }: FeatureSection4Props) {
    // 触发点：当滚动到 0.2 时触发动画
    const triggerPoint = 0.2;
    const isTriggered = scrollProgress >= triggerPoint;

    const height = 200;
    // 触发前: 宽度 = 1000, 触发后: 宽度 = 300
    const targetWidth = isTriggered ? height * 3 / 2 : height * 3 / 2 + 700;

    return (
        <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
                perspective: `1200px`,
                perspectiveOrigin: 'center 10%'
            }}
        >
            {/* 卡片容器 - 3:2 比例 */}
            <motion.div
                className="relative aspect-[3/2]"
                animate={{
                    width: targetWidth,
                }}
                transition={springTransition}
                style={{
                    height: `${height}px`,
                    transformStyle: 'preserve-3d',
                }}
            >
                {cards.map((card, index) => {
                    // 每张卡片的目标角度: 0°, 30°, 60°, 90°
                    const targetAngle = index * 30;
                    // 触发前: 所有卡片都有额外的 60° + targetAngle 偏移
                    // 触发后: 卡片到达目标角度 0
                    const currentAngle = isTriggered ? 0 : -(60 + targetAngle);

                    // z-index: 后面的卡片在下面
                    const zIndex = cards.length + index;

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
                            animate={{
                                rotateX: currentAngle,
                            }}
                            transition={springTransition}
                            style={{
                                transformStyle: 'preserve-3d',
                                transformOrigin: 'center calc(100% + 100%)',
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
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
