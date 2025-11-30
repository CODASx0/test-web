'use client';

interface FeatureSection3Props {
    scrollProgress: number;
}

export function FeatureSection3({ scrollProgress }: FeatureSection3Props) {
    // 示例：旋转 + 淡入动画
    const rotate = (1 - Math.min(1, scrollProgress * 2)) * 10;
    const opacity = Math.min(1, scrollProgress * 3);

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center p-8">
            <div
                className="text-center space-y-6"
                style={{
                    opacity,
                    transform: `rotate(${rotate}deg)`,
                }}
            >
                <h3 className="text-4xl font-bold text-neutral-900">
                    Section 3
                </h3>
                <p className="max-w-lg text-neutral-600">
                    这是第三个 Section，你可以在这里自由添加任何内容和布局。
                </p>
                <div className="text-sm text-blue-600 font-mono">
                    scrollProgress: {scrollProgress.toFixed(3)}
                </div>
            </div>
        </div>
    );
}
