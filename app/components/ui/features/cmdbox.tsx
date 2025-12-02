'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// 添加图标
function PlusIcon({ className }: { className?: string }) {
    return (
        <img
            src="/icon/Add.svg"
            alt="Add"
            className={className}
            width={32}
            height={32}
        />
    );
}

// 调节图标
function TuneIcon({ className }: { className?: string }) {
    return (
        <img
            src="/icon/Tune.svg"
            alt="Tune"
            className={className}
            width={32}
            height={32}
        />
    );
}

// 发送箭头图标
function ArrowUpIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// 图标按钮组件
function IconButton({
    children,
    className,
    onClick,
    variant = 'default',
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'default' | 'primary';
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center size-[32px] rounded-[10px] cursor-pointer transition-colors duration-200 ease ${variant === 'default' ? 'text-zinc-500 hover:text-zinc-700 hover:bg-black/5' : ''} ${variant === 'primary' ? 'bg-[#202030] border border-[#09090b] text-white rounded-full shadow-[inset_0px_2px_1px_0px_rgba(255,255,255,0.1),inset_0px_4px_10px_0px_rgba(255,255,255,0.2)] hover:bg-[#2a2a40]' : ''} ${className ?? ''}`}
        >
            {children}
        </button>
    );
}

interface CmdBoxProps {
    className?: string;
    placeholder?: string;
    messages?: string[];
    typingSpeed?: number;
    pauseDuration?: number;
    onSubmit?: (value: string) => void;
}

export function CmdBox({
    className,
    placeholder = 'Ask me anything...',
    messages,
    typingSpeed = 50,
    pauseDuration = 2000,
    onSubmit,
}: CmdBoxProps) {
    const [displayText, setDisplayText] = useState('');
    
    // 使用 ref 来追踪内部状态，避免闭包问题
    const stateRef = useRef({
        messageIndex: 0,
        charIndex: 0,
        phase: 'typing' as 'typing' | 'pausing' | 'deleting',
    });
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // 稳定化 messages 引用
    const messagesRef = useRef(messages);
    messagesRef.current = messages;

    const tick = useCallback(() => {
        const msgs = messagesRef.current;
        if (!msgs || msgs.length === 0) return;
        
        const state = stateRef.current;
        const currentMessage = msgs[state.messageIndex];
        
        if (state.phase === 'typing') {
            if (state.charIndex < currentMessage.length) {
                state.charIndex++;
                setDisplayText(currentMessage.slice(0, state.charIndex));
                timerRef.current = setTimeout(tick, typingSpeed);
            } else {
                state.phase = 'pausing';
                timerRef.current = setTimeout(tick, pauseDuration);
            }
        } else if (state.phase === 'pausing') {
            state.phase = 'deleting';
            timerRef.current = setTimeout(tick, typingSpeed / 2);
        } else if (state.phase === 'deleting') {
            if (state.charIndex > 0) {
                state.charIndex--;
                setDisplayText(currentMessage.slice(0, state.charIndex));
                timerRef.current = setTimeout(tick, typingSpeed / 2);
            } else {
                state.messageIndex = (state.messageIndex + 1) % msgs.length;
                state.phase = 'typing';
                timerRef.current = setTimeout(tick, typingSpeed);
            }
        }
    }, [typingSpeed, pauseDuration]);

    // 启动打字机效果
    useEffect(() => {
        if (!messages || messages.length === 0) return;
        
        // 重置状态
        stateRef.current = {
            messageIndex: 0,
            charIndex: 0,
            phase: 'typing',
        };
        setDisplayText('');
        
        // 启动
        timerRef.current = setTimeout(tick, typingSpeed);
        
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    // 只在 messages 数组内容变化时重新启动
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages?.join(','), tick]);

    const hasMessages = messages && messages.length > 0;

    return (
        <div
            className={`backdrop-blur-[5px] bg-white rounded-2xl flex flex-col h-full ${className ?? ''}`}
        >
            {/* 输入区域 */}
            <div className="px-[14px] pt-3 pb-3 h-full relative">
                {hasMessages ? (
                    <div className="w-full h-full font-manrope font-medium text-sm leading-5 tracking-[0.2px] text-zinc-900 whitespace-pre-wrap">
                        {displayText}
                        <span className="inline-block w-[2px] h-[1em] bg-zinc-900 align-middle ml-[1px] animate-cursor-blink" />
                    </div>
                ) : (
                    <textarea
                        placeholder={placeholder}
                        className="w-full h-full bg-transparent font-manrope font-medium text-sm leading-5 tracking-[0.2px] text-zinc-700 placeholder:text-zinc-700/20 outline-none resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
                                e.preventDefault();
                                onSubmit((e.target as HTMLTextAreaElement).value);
                            }
                        }}
                    />
                )}
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between p-2 rounded-b-2xl">
                {/* 左侧按钮组 */}
                <div className="flex items-center gap-1">
                    <IconButton>
                        <PlusIcon />
                    </IconButton>

                    <IconButton>
                        <TuneIcon />
                    </IconButton>
                </div>

                {/* 右侧发送按钮 */}
                <IconButton variant="primary">
                    <ArrowUpIcon className="size-[14px]" />
                </IconButton>
            </div>
        </div>
    );
}
