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
            
        </div>
    );
}
