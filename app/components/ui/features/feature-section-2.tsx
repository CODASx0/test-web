'use client';

interface FeatureSection2Props {
    scrollProgress: number;
}

export function FeatureSection2({ scrollProgress }: FeatureSection2Props) {
    // 示例：缩放动画
    const scale = 0.8 + Math.min(0.2, scrollProgress * 0.5);
    const opacity = Math.min(1, scrollProgress * 3);

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center p-8">
            <div
                className="text-center space-y-6"
                style={{
                    opacity,
                    transform: `scale(${scale})`,
                }}
            >
                <h3 className="text-4xl font-bold text-neutral-900">
                    Section 2
                </h3>
                <p className="max-w-lg text-neutral-600">
                    这是第二个 Section，你可以在这里自由添加任何内容和布局。
                </p>
                <div className="text-sm text-blue-600 font-mono">
                    scrollProgress: {scrollProgress.toFixed(3)}
                </div>
            </div>
        </div>
    );
}
