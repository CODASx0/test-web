'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { FeatureSection1 } from './feature-section-1';
import { FeatureSection2 } from './feature-section-2';
import { FeatureSection3 } from './feature-section-3';
import { FeatureSection4 } from './feature-section-4';
import { cn } from '@/lib/utils';

const sections = [
    { id: 'section-1', label: 'Section 1', Component: FeatureSection1 },
    { id: 'section-2', label: 'Section 2', Component: FeatureSection2 },
    { id: 'section-3', label: 'Section 3', Component: FeatureSection3 },
    { id: 'section-4', label: 'Section 4', Component: FeatureSection4 },
];

// 计算单个元素的滚动进度
function calculateProgress(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // 元素顶部接触视口底部 -> 0
    // 元素底部接触视口顶部 -> 1
    const start = windowHeight;
    const end = -rect.height;
    const current = rect.top;

    const progress = (start - current) / (start - end);
    return Math.max(0, Math.min(1, progress));
}

export function FeaturesSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const progressBarRefs = useRef<(HTMLDivElement | null)[]>([]);
    const progressTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // 用于存储当前进度值，供子组件使用
    const progressValuesRef = useRef<number[]>(sections.map(() => 0));
    const [progressValues, setProgressValues] = useState<number[]>(sections.map(() => 0));

    const isScrollingToTarget = useRef(false);
    const targetIndex = useRef<number | null>(null);
    const rafId = useRef<number | null>(null);

    // 使用 RAF 实时更新进度条（直接操作 DOM，避免 React 重渲染）
    const updateProgressRAF = useCallback(() => {
        const newProgresses = sectionRefs.current.map((ref) => {
            if (!ref) return 0;
            return calculateProgress(ref);
        });

        // 直接更新 DOM 元素
        newProgresses.forEach((progress, index) => {
            const barEl = progressBarRefs.current[index];
            const textEl = progressTextRefs.current[index];
            if (barEl) {
                barEl.style.width = `${progress * 100}%`;
            }
            if (textEl) {
                textEl.textContent = progress.toFixed(2);
            }
        });

        // 更新 ref 值供子组件使用
        progressValuesRef.current = newProgresses;

        // 检查是否正在跳转到目标
        if (isScrollingToTarget.current && targetIndex.current !== null) {
            const targetRef = sectionRefs.current[targetIndex.current];
            if (targetRef) {
                const rect = targetRef.getBoundingClientRect();
                const windowCenter = window.innerHeight / 2;
                if (Math.abs(rect.top + rect.height / 2 - windowCenter) < 100) {
                    isScrollingToTarget.current = false;
                    targetIndex.current = null;
                }
            }
        }

        rafId.current = requestAnimationFrame(updateProgressRAF);
    }, []);

    // 定期同步 state（用于传递给子组件），降低频率避免性能问题
    useEffect(() => {
        const syncInterval = setInterval(() => {
            setProgressValues([...progressValuesRef.current]);
        }, 16); // ~60fps

        return () => clearInterval(syncInterval);
    }, []);

    useEffect(() => {
        rafId.current = requestAnimationFrame(updateProgressRAF);
        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, [updateProgressRAF]);


    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
            if (isScrollingToTarget.current) return;

            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = sectionRefs.current.findIndex(ref => ref === entry.target);
                    if (index !== -1) {
                        setActiveIndex(index);
                    }
                }
            });
        }, observerOptions);

        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (index: number) => {
        isScrollingToTarget.current = true;
        targetIndex.current = index;
        setActiveIndex(index);
        sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <section ref={containerRef} className="w-full py-25 bg-[#ffffff] overflow-clip">
            <div className="max-w-7xl mx-auto px-15">

                <div className="flex gap-[60px]">
                    {/* 左侧 Sticky 导航 */}
                    <nav className="w-[320px] hidden md:flex flex-col gap-3 shrink-0 sticky top-20 h-fit">
                        {sections.map((section, index) => (
                            <div key={section.id} className="flex flex-col">
                                <button
                                    onClick={() => scrollToSection(index)}
                                    className={cn(
                                        "text-left text-sm transition-colors duration-200 ease",
                                        "py-1 px-0 rounded-lg border-transparent",
                                        "hover:text-neutral-900 hover:border-neutral-300",
                                        index === activeIndex
                                            ? "text-neutral-900"
                                            : "text-neutral-500"
                                    )}
                                >
                                    {section.label}
                                </button>
                                {/* 滚动进度显示 - 使用 ref 直接更新 DOM */}
                                <div className="px-0 mt-0">
                                    <div className="h-0.5 bg-neutral-200 rounded-full overflow-hidden">
                                        <div
                                            ref={(el) => { progressBarRefs.current[index] = el; }}
                                            className="h-full bg-neutral-600 rounded-full"
                                            style={{ width: '0%' }}
                                        />
                                    </div>
                                    <span
                                        ref={(el) => { progressTextRefs.current[index] = el; }}
                                        className="text-[10px] text-neutral-400 font-mono"
                                    >
                                        0.00
                                    </span>
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* 右侧内容区域 */}
                    <div className="flex-1 space-y-[24px]">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                ref={(el) => { sectionRefs.current[index] = el; }}
                                id={section.id}
                                className="w-full aspect-[3/2] rounded-[16px] bg-[#f4f4f5] overflow-hidden"
                            >
                                <section.Component scrollProgress={progressValues[index]} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

