'use client';

interface FeatureSection4Props {
    scrollProgress: number;
}

const cards = [
    { id: 1, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', title: 'Design', subtitle: 'Create beautiful interfaces' },
    { id: 2, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', title: 'Develop', subtitle: 'Build with modern tools' },
    { id: 3, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', title: 'Deploy', subtitle: 'Ship to production' },
    { id: 4, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', title: 'Scale', subtitle: 'Grow with confidence' },
];

export function FeatureSection4({ scrollProgress }: FeatureSection4Props) {
    // 将scrollProgress映射到0-90度
    // 使用easeOutQuint让动画更自然
    const easeOutQuint = (x: number) => x;
    const easedProgress = easeOutQuint(scrollProgress);

    return (
        <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
                perspective: '1200px',
                perspectiveOrigin: 'center 40%'
            }}
        >
            {/* 卡片容器 */}
            <div
                className="relative"
                style={{
                    width: '320px',
                    height: '200px',
                    transformStyle: 'preserve-3d',
                }}
            >
                {cards.map((card, index) => {
                    // 每张卡片的目标角度: 0°, 30°, 60°, 90°
                    const targetAngle = index * 30;
                    // 根据滚动进度计算当前角度
                    // 初始时所有卡片角度为0（堆叠），随着滚动展开
                    const currentAngle = easedProgress * 120*(5-easedProgress) + targetAngle;

                    // z-index: 后面的卡片在下面
                    const zIndex = cards.length - index;

                    // 稍微调整透明度，让层次更明显
                    const opacity = 1;

                    return (
                        <div
                            key={card.id}
                            className="absolute inset-0 rounded-2xl overflow-hidden"
                            style={{
                                background: card.gradient,
                                transformStyle: 'preserve-3d',
                                // 旋转原点在底部下方40px
                                transformOrigin: 'center calc(100% + 200%)',
                                // 绕X轴旋转（负值让卡片向后翻转）
                                transform: `rotateX(${-currentAngle}deg)`,
                                zIndex,
                                opacity,
                                backfaceVisibility: 'hidden',
                                willChange: 'transform',
                            }}
                        >
                            {/* 卡片内容 */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                {/* 顶部装饰 */}
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/30" />
                                    <div className="w-3 h-3 rounded-full bg-white/20" />
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                </div>

                                {/* 主要内容 */}
                                <div>
                                    <h3 className="text-white font-semibold text-2xl tracking-tight mb-1">
                                        {card.title}
                                    </h3>
                                    <p className="text-white/70 text-sm">
                                        {card.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* 光泽效果 */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)',
                                }}
                            />
                        </div>
                    );
                })}
            </div>



        </div>
    );
}
