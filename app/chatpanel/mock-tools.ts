/**
 * Mock 工具函数 - 用于生成模拟的通知数据
 */

import {
  type AIMsgDTO,
  type ContentPartDelta,
  type ContentPartDeltaData,
  type ContentPartDTOUnion,
  type DeltaType,
  type ErrorOccurred,
  type MediasNum,
  MsgProducerRole,
  type Notification,
  NotifType,
  type RunMode,
  type ToolResult,
  type Usage,
} from './types';

export type ToolCallInfo = {
  tool_id: string;
  tool_call_id: string;
  tool_display_name: string;
};

export type ToolCallResult = {
  actual_duration_ms: number | undefined;
  result_list: ToolResult[] | undefined;
};

export const mockChatMsgHandlingStarted = (
  id: number,
  msg_id: string
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.CHAT_MSG_HANDLING_STARTED,
    body: {
      chat_msg_handling_started: {},
    },
  };
};

export const mockChatMsgHandlingEnded = (
  id: number,
  msg_id: string
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.CHAT_MSG_HANDLING_ENDED,
    body: {
      chat_msg_handling_ended: {},
    },
  };
};

export const mockToolRunStarted = (
  id: number,
  msg_id: string,
  tool_call_info: ToolCallInfo,
  run_mode: RunMode,
  medias_num: MediasNum
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.TOOL_RUN_STARTED,
    body: {
      tool_run_started: {
        ...tool_call_info,
        run_mode,
        medias_num,
      },
    },
  };
};

export const mockToolRunEnded = (
  id: number,
  msg_id: string,
  tool_call_info: ToolCallInfo,
  result: ToolCallResult
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.TOOL_RUN_ENDED,
    body: {
      tool_run_ended: {
        ...tool_call_info,
        actual_duration_ms: result.actual_duration_ms ?? 0,
        result_list: result.result_list ?? [],
      },
    },
  };
};

export const mockConfirmToolCall = (
  id: number,
  msg_id: string,
  tool_call_info: ToolCallInfo,
  medias_num: MediasNum,
  estimated_credits: number
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.CONFIRM_TOOL_CALL,
    body: {
      confirm_tool_call: {
        ...tool_call_info,
        estimated_credits,
        medias_num,
      },
    },
  };
};

export const mockToolRunReport = (
  id: number,
  msg_id: string,
  tool_call_info: ToolCallInfo,
  elapsed_ms: number,
  estimated_duration_ms: number
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.TOOL_RUN_REPORT,
    body: {
      tool_run_report: {
        ...tool_call_info,
        elapsed_ms,
        estimated_duration_ms,
      },
    },
  };
};

export const mockAIMsgData = (
  id: string,
  producer_role: MsgProducerRole = MsgProducerRole.AI,
  usage: Usage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_written_input_tokens: 0,
    cache_read_input_tokens: 0,
  },
  extra: Record<string, unknown> = {}
): AIMsgDTO => {
  return {
    id,
    model: '',
    producer_role,
    usage,
    extra,
  };
};

export const mockAIMsgStart = (
  id: number,
  msg_id: string,
  beginning: AIMsgDTO
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.AI_MSG_STARTED,
    body: {
      ai_msg_started: {
        beginning,
      },
    },
  };
};

export const mockAIMsgDelta = (
  id: number,
  msg_id: string,
  delta: AIMsgDTO
): Notification => {
  return {
    id,
    type: NotifType.AI_MSG_DELTA,
    user_msg_id: msg_id,
    body: {
      ai_msg_delta: {
        delta,
      },
    },
  };
};

export const mockAIMsgEnd = (
  id: number,
  msg_id: string,
  delta: AIMsgDTO
): Notification => {
  return {
    id,
    type: NotifType.AI_MSG_ENDED,
    user_msg_id: msg_id,
    body: {
      ai_msg_ended: {
        delta,
      },
    },
  };
};

export const mockContentPartStart = (
  id: number,
  msg_id: string,
  part_index: number,
  beginning: ContentPartDTOUnion
): Notification => {
  return {
    id,
    type: NotifType.CONTENT_PART_STARTED,
    user_msg_id: msg_id,
    body: {
      content_part_started: {
        part_index,
        ai_msg_id: msg_id,
        beginning,
      },
    },
  };
};

export const mockContentPartDeltaData = (
  thinking_delta?: { thinking: string },
  text_delta?: { text: string },
  tool_call_delta?: { tool_call_id?: string; tool_name?: string; args?: string }
): ContentPartDeltaData => {
  if (text_delta) {
    return { text_delta };
  }
  if (tool_call_delta) {
    return { tool_call_delta };
  }
  if (thinking_delta) {
    return { thinking_delta };
  }
  return { $unknown: ['unknown', {}] };
};

export const mockContentPartDelta = (
  id: number,
  msg_id: string,
  part_index: number,
  delta_type: DeltaType,
  usage: Usage,
  ai_msg_id: string,
  delta: ContentPartDeltaData
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.CONTENT_PART_DELTA,
    body: {
      content_part_delta: {
        part_index,
        ai_msg_id,
        delta_type,
        delta,
        usage,
      } as ContentPartDelta,
    },
  };
};

export const mockContentPartEnd = (
  id: number,
  msg_id: string,
  part_index: number
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.CONTENT_PART_ENDED,
    body: {
      content_part_ended: {
        part_index,
        ai_msg_id: msg_id,
      },
    },
  };
};

export const mockErrorOccurred = (
  id: number,
  msg_id: string,
  error_occurred: ErrorOccurred
): Notification => {
  return {
    id,
    user_msg_id: msg_id,
    type: NotifType.ERROR_OCCURRED,
    body: {
      error_occurred,
    },
  };
};
