/**
 * 消息对话相关类型定义
 * 简化版本，基于 @one2x/medeo-web-api 的核心类型
 */

// 通知类型枚举
export const NotifType = {
  CHAT_MSG_HANDLING_STARTED: 'CHAT_MSG_HANDLING_STARTED',
  CHAT_MSG_HANDLING_ENDED: 'CHAT_MSG_HANDLING_ENDED',
  AI_MSG_STARTED: 'AI_MSG_STARTED',
  AI_MSG_DELTA: 'AI_MSG_DELTA',
  AI_MSG_ENDED: 'AI_MSG_ENDED',
  CONTENT_PART_STARTED: 'CONTENT_PART_STARTED',
  CONTENT_PART_DELTA: 'CONTENT_PART_DELTA',
  CONTENT_PART_ENDED: 'CONTENT_PART_ENDED',
  TOOL_RUN_STARTED: 'TOOL_RUN_STARTED',
  TOOL_RUN_ENDED: 'TOOL_RUN_ENDED',
  TOOL_RUN_REPORT: 'TOOL_RUN_REPORT',
  CONFIRM_TOOL_CALL: 'CONFIRM_TOOL_CALL',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
} as const;

export type NotifType = (typeof NotifType)[keyof typeof NotifType];

// 内容部分类型
export const ContentPartType = {
  TEXT: 'TEXT',
  THINKING: 'THINKING',
  TOOL_CALL: 'TOOL_CALL',
  FILE_REFERENCE: 'FILE_REFERENCE',
  TODO_LIST: 'TODO_LIST',
} as const;

export type ContentPartType = (typeof ContentPartType)[keyof typeof ContentPartType];

// Delta 类型
export const DeltaType = {
  TEXT_DELTA: 'TEXT_DELTA',
  THINKING_DELTA: 'THINKING_DELTA',
  TOOL_CALL_DELTA: 'TOOL_CALL_DELTA',
} as const;

export type DeltaType = (typeof DeltaType)[keyof typeof DeltaType];

// 运行模式
export const RunMode = {
  SYNC: 'SYNC',
  ASYNC: 'ASYNC',
} as const;

export type RunMode = (typeof RunMode)[keyof typeof RunMode];

// 媒体类型
export const MediaType = {
  IMAGE_JPG: 'IMAGE_JPG',
  IMAGE_PNG: 'IMAGE_PNG',
  VIDEO_MP4: 'VIDEO_MP4',
  AUDIO_MP3: 'AUDIO_MP3',
  DOCUMENT_MD: 'DOCUMENT_MD',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

// 媒体来源
export const MediaSource = {
  USER_UPLOAD: 'USER_UPLOAD',
  AI_GENERATED: 'AI_GENERATED',
} as const;

export type MediaSource = (typeof MediaSource)[keyof typeof MediaSource];

// 媒体业务类型
export const MediaBizKind = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
} as const;

export type MediaBizKind = (typeof MediaBizKind)[keyof typeof MediaBizKind];

// 消息生产者角色
export const MsgProducerRole = {
  AI: 'AI',
  USER: 'USER',
  SYSTEM: 'SYSTEM',
} as const;

export type MsgProducerRole = (typeof MsgProducerRole)[keyof typeof MsgProducerRole];

// 发送者角色
export const SenderRole = {
  USER: 'USER',
  AGENT: 'AGENT',
} as const;

export type SenderRole = (typeof SenderRole)[keyof typeof SenderRole];

// 用量统计
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_written_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// AI 消息 DTO
export interface AIMsgDTO {
  id: string;
  producer_role: MsgProducerRole;
  model: string;
  usage: Usage;
  extra?: Record<string, unknown>;
}

// 媒体信息
export interface MediaInfo {
  id: string;
  type: MediaType;
  biz_kind: MediaBizKind;
  storage_key: string;
  source: MediaSource;
  size_bytes: number;
}

// 媒体数量
export interface MediasNum {
  media_type: MediaType;
  num: number;
}

// 文本内容
export interface TextPart {
  type: typeof ContentPartType.TEXT;
  text: string;
}

// 思考内容
export interface ThinkingPart {
  type: typeof ContentPartType.THINKING;
  thinking: string;
}

// 工具调用
export interface ToolCallPart {
  type: typeof ContentPartType.TOOL_CALL;
  id: string;
  tool_name: string;
  args: string;
}

// 文件引用
export interface FileReferencePart {
  type: typeof ContentPartType.FILE_REFERENCE;
  media?: MediaInfo;
  file_url?: string;
  media_type?: MediaType;
}

// 内容部分联合类型
export interface ContentPartDTOUnion {
  text?: TextPart;
  thinking?: ThinkingPart;
  tool_call?: ToolCallPart;
  file_reference?: FileReferencePart;
}

// 内容部分
export interface ContentPart {
  text?: TextPart;
  thinking?: ThinkingPart;
  tool_call?: {
    tool_call_id: string;
    tool_id: string;
    tool_display_name: string;
    type?: ContentPartType;
  };
  file_reference?: FileReferencePart;
  todo_list?: {
    type: typeof ContentPartType.TODO_LIST;
    todos: Array<{
      id: string;
      status: string;
      content: string;
    }>;
  };
}

// 工具调用 Delta 数据
export interface ToolCallDeltaData {
  tool_call_id?: string;
  tool_name?: string;
  args?: string;
}

// 内容部分 Delta 数据
export interface ContentPartDeltaData {
  text_delta?: { text: string };
  thinking_delta?: { thinking: string };
  tool_call_delta?: ToolCallDeltaData;
  $unknown?: [string, unknown];
}

// 内容部分 Delta
export interface ContentPartDelta {
  part_index: number;
  ai_msg_id: string;
  delta_type: DeltaType;
  delta: ContentPartDeltaData;
  usage: Usage;
}

// 工具结果
export interface ToolResult {
  success: boolean;
  type: ContentPartType;
  tool_call_id: string;
  tool_id: string;
  tool_display_name: string;
  actual_duration_ms: number;
  data: ContentPart[];
}

// 错误信息
export interface ErrorOccurred {
  code: string;
  message: string;
}

// 通知消息体
export interface NotificationBody {
  chat_msg_handling_started?: Record<string, never>;
  chat_msg_handling_ended?: Record<string, never>;
  ai_msg_started?: { beginning: AIMsgDTO };
  ai_msg_delta?: { delta: AIMsgDTO };
  ai_msg_ended?: { delta: AIMsgDTO };
  content_part_started?: {
    part_index: number;
    ai_msg_id: string;
    beginning: ContentPartDTOUnion;
  };
  content_part_delta?: ContentPartDelta;
  content_part_ended?: {
    part_index: number;
    ai_msg_id: string;
  };
  tool_run_started?: {
    tool_id: string;
    tool_call_id: string;
    tool_display_name: string;
    run_mode: RunMode;
    medias_num: MediasNum;
  };
  tool_run_ended?: {
    tool_id: string;
    tool_call_id: string;
    tool_display_name: string;
    actual_duration_ms: number;
    result_list: ToolResult[];
  };
  tool_run_report?: {
    tool_id: string;
    tool_call_id: string;
    tool_display_name: string;
    elapsed_ms: number;
    estimated_duration_ms: number;
  };
  confirm_tool_call?: {
    tool_id: string;
    tool_call_id: string;
    tool_display_name: string;
    estimated_credits: number;
    medias_num: MediasNum;
  };
  error_occurred?: ErrorOccurred;
}

// 通知
export interface Notification {
  id: number;
  user_msg_id: string;
  type: NotifType;
  body: NotificationBody;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_role: SenderRole;
  sent_at: Date;
  content: ContentPart[];
}
