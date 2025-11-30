'use client';

interface FeatureSection1Props {
    scrollProgress: number;
}

export function FeatureSection1({ scrollProgress }: FeatureSection1Props) {
    // 示例：基于 scrollProgress 的动画
    // scrollProgress: 0 (刚进入视口底部) -> 1 (离开视口顶部)
    // 通常 0.3-0.7 是元素在视口中心区域的范围

    // 示例动画：元素在进入时淡入并上移
    const opacity = Math.min(1, scrollProgress * 3);
    const translateY = Math.max(0, (1 - scrollProgress * 2) * 50);

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center">
            
        </div>
    );
}
