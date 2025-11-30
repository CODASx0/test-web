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
            
        </div>
    );
}
