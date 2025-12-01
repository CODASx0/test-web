'use client';

// 添加图标
function PlusIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M9 3.75V14.25M3.75 9H14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// 调节图标
function TuneIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2.25 4.5H5.25M5.25 4.5C5.25 5.32843 5.92157 6 6.75 6C7.57843 6 8.25 5.32843 8.25 4.5C8.25 3.67157 7.57843 3 6.75 3C5.92157 3 5.25 3.67157 5.25 4.5ZM2.25 13.5H7.5M15.75 13.5H12M12 13.5C12 14.3284 11.3284 15 10.5 15C9.67157 15 9 14.3284 9 13.5C9 12.6716 9.67157 12 10.5 12C11.3284 12 12 12.6716 12 13.5ZM15.75 4.5H10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
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
    onSubmit?: (value: string) => void;
}

export function CmdBox({
    className,
    placeholder = 'Ask me anything...',
    onSubmit,
}: CmdBoxProps) {
    return (
        <div
            className={`backdrop-blur-[5px] bg-white rounded-2xl flex flex-col h-full ${className ?? ''}`}
        >
            {/* 输入区域 */}
            <div className="px-[14px] py-3 h-full">
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full bg-transparent font-manrope font-medium text-sm leading-5 tracking-[0.2px] text-zinc-700 placeholder:text-zinc-700/20 outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && onSubmit) {
                            onSubmit((e.target as HTMLInputElement).value);
                        }
                    }}
                />
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between p-2 rounded-b-2xl">
                {/* 左侧按钮组 */}
                <div className="flex items-center gap-1">
                    <IconButton>
                        <PlusIcon className="size-[18px]" />
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
