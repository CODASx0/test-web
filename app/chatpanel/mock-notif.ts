/**
 * 模拟通知数据
 * 用于演示消息对话的流式渲染效果
 */

import {
  type ContentPart,
  type ContentPartDeltaData,
  ContentPartType,
  DeltaType,
  MediaBizKind,
  MediaSource,
  MediaType,
  MsgProducerRole,
  type Notification,
  RunMode,
} from './types';

import { scopedULID, getRandomCatImageUrl, getRandomImageUrl, loadTestMd } from './utils';

import {
  mockAIMsgDelta,
  mockAIMsgEnd,
  mockAIMsgStart,
  mockChatMsgHandlingEnded,
  mockChatMsgHandlingStarted,
  mockContentPartDelta,
  mockContentPartDeltaData,
  mockContentPartEnd,
  mockContentPartStart,
  mockToolRunEnded,
  mockToolRunReport,
  mockToolRunStarted,
  type ToolCallInfo,
} from './mock-tools';

// 辅助函数：将文本分割成片段
const splitTextIntoChunks = (text: string): string[] => {
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    // 随机选择 1-3 个字符的长度
    const chunkLength = Math.floor(Math.random() * 3) + 1;
    // 确保不超过剩余文本长度
    const actualLength = Math.min(chunkLength, text.length - i);
    const chunk = text.slice(i, i + actualLength);

    if (chunk) {
      chunks.push(chunk);
    }

    i += actualLength;
  }

  return chunks;
};

// 辅助函数：生成文本内容部分的通知序列
const mockContentParts = (
  text: string,
  ai_msg_id: string,
  part_index: number,
  delta_type: DeltaType = DeltaType.TEXT_DELTA
): Notification[] => {
  const chunks = splitTextIntoChunks(text);

  return [
    mockContentPartStart(123, ai_msg_id, -1, {
      text: {
        type: ContentPartType.TEXT,
        text: '',
      },
    }),
    ...chunks.map((v) => {
      const delta =
        delta_type === DeltaType.TEXT_DELTA
          ? mockContentPartDeltaData(undefined, { text: v })
          : mockContentPartDeltaData({ thinking: v });
      return mockContentPartDelta(
        456,
        ai_msg_id,
        part_index,
        delta_type,
        {
          input_tokens: 0,
          output_tokens: 0,
          cache_written_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
        ai_msg_id,
        delta as ContentPartDeltaData
      );
    }),
    mockContentPartEnd(789, ai_msg_id, part_index),
  ];
};

// 辅助函数：生成完整的 AI 消息序列
const mockAIMsg = (parts: Notification[]): Notification[] => {
  return [
    mockAIMsgStart(123, '123', {
      id: scopedULID('chat'),
      producer_role: MsgProducerRole.AI,
      model: 'gpt-4',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    }),
    mockAIMsgDelta(123123, '123', {
      id: '123',
      producer_role: MsgProducerRole.AI,
      model: 'gpt-4',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    }),
    ...parts,
    mockAIMsgEnd(123123, '123', {
      id: '123',
      producer_role: MsgProducerRole.AI,
      model: 'gpt-4',
      usage: {
        input_tokens: 20,
        output_tokens: 10,
      },
    }),
  ];
};

// 辅助函数：生成工具调用序列
const mockToolCall = (
  tool_info: ToolCallInfo,
  run_mode: RunMode,
  medias_num: { media_type: MediaType; num: number },
  result: ContentPart[] = [],
  parts: Notification[] = []
): Notification[] => {
  return [
    mockToolRunStarted(123, '123', tool_info, run_mode, medias_num),
    ...parts,
    mockToolRunEnded(123, '123', tool_info, {
      actual_duration_ms: 2000,
      result_list: [
        {
          success: true,
          type: ContentPartType.FILE_REFERENCE,
          tool_call_id: tool_info.tool_call_id,
          tool_id: tool_info.tool_id,
          tool_display_name: tool_info.tool_display_name,
          actual_duration_ms: 2000,
          data: result,
        },
      ],
    }),
    mockToolRunReport(123, '123', tool_info, 2000, 2000),
  ];
};

// 辅助函数：生成图片部分
const mockImages = (
  nums: number,
  urlCreator: () => string = getRandomImageUrl
): ContentPart[] => {
  return Array.from({ length: nums }).map(() => {
    return {
      file_reference: {
        type: ContentPartType.FILE_REFERENCE,
        media: {
          id: scopedULID('media'),
          type: MediaType.IMAGE_JPG,
          biz_kind: MediaBizKind.IMAGE,
          storage_key: urlCreator(),
          source: MediaSource.AI_GENERATED,
          size_bytes: 1000,
        },
      },
    };
  });
};

// 导出：简单文本消息测试
export const mockNotificationList1: Notification[] = [
  mockChatMsgHandlingStarted(1, scopedULID('chat')),
  ...mockAIMsg(
    mockContentParts(loadTestMd(), 'ai_msg_1', -1, DeltaType.TEXT_DELTA)
  ),
  mockChatMsgHandlingEnded(1, '123'),
];

// 导出：工具调用测试
export const mockNotificationList2: Notification[] = [
  mockChatMsgHandlingStarted(1, scopedULID('chat')),
  ...mockToolCall(
    {
      tool_id: 'tool_id_1',
      tool_call_id: 'tool_call_id_2',
      tool_display_name: 'Generate 3D Image',
    },
    RunMode.SYNC,
    {
      media_type: MediaType.IMAGE_JPG,
      num: 3,
    },
    mockImages(3)
  ),
  mockChatMsgHandlingEnded(1, '123'),
];

// 导出：完整对话流程测试
export const mockNotificationList: Notification[] = [
  mockChatMsgHandlingStarted(1, scopedULID('chat')),

  ...mockAIMsg(
    mockContentParts(
      '让我思考下接下来要做什么，用户想要生成一个海绵宝宝营销视频！基于您的描述，我将创建一个现代化的3D玻璃质感海绵宝宝营销内容。',
      'ai_msg_1',
      -1,
      DeltaType.THINKING_DELTA
    )
  ),

  // 1. 第一条 AI 消息：介绍海绵宝宝视频项目
  ...mockAIMsg(
    mockContentParts(
      '## 我来为您制作一个海绵宝宝营销视频！基于您的描述，我将创建一个现代化的3D玻璃质感海绵宝宝营销内容。',
      'ai_msg_1',
      0
    )
  ),

  // 2. 第二条 AI 消息：创建脚本文件
  ...mockAIMsg(mockContentParts('### 让我来创建下脚本文件', 'ai_msg_2', 1)),

  // 3. 工具调用：Write Script
  ...mockToolCall(
    {
      tool_id: 'tool_id_1',
      tool_call_id: 'tool_call_id_1',
      tool_display_name: 'Write Script',
    },
    RunMode.SYNC,
    {
      media_type: MediaType.DOCUMENT_MD,
      num: 1,
    }
  ),

  // 4. 第三条 AI 消息：生成 3D 图像
  ...mockAIMsg(
    mockContentParts(
      '### 现在开始生成3D玻璃质感的海绵宝宝图像：',
      'ai_msg_3',
      2
    )
  ),

  // 5. 工具调用：Generate 3D Image
  ...mockToolCall(
    {
      tool_id: 'tool_id_1',
      tool_call_id: 'tool_call_id_2',
      tool_display_name: 'Generate 3D Image',
    },
    RunMode.SYNC,
    {
      media_type: MediaType.IMAGE_JPG,
      num: 3,
    },
    mockImages(3)
  ),

  // 6. 第四条 AI 消息：生成视频需要15分钟
  ...mockAIMsg(
    mockContentParts('__现在开始生成视频大约 15 分钟：__', 'ai_msg_5', 3)
  ),

  // 7. 第五条 AI 消息：推荐喝茶
  ...mockAIMsg(
    mockContentParts(
      '> __我知道你很急，但是你先别急__，可以先喝杯茶，推荐一款不错的茶：',
      'ai_msg_6',
      4
    )
  ),

  // 8. 第六条 AI 消息：购物推荐模块
  ...mockAIMsg(
    mockContentParts(
      '### 调用购物推荐模块，（下面是随机图片，请把他们想象成茶）：',
      'ai_msg_7',
      5
    )
  ),

  // 9. 工具调用：生成图片（购物推荐）
  ...mockToolCall(
    {
      tool_id: scopedULID('chat'),
      tool_call_id: 'tool_call_id_3',
      tool_display_name: 'shopping recommend',
    },
    RunMode.SYNC,
    {
      media_type: MediaType.IMAGE_JPG,
      num: 3,
    },
    mockImages(3)
  ),

  // 10. 第七条 AI 消息：进度提示
  ...mockAIMsg(
    mockContentParts(
      '__还剩下最后 1% 的进度，请稍等，你可以选择升级套餐加速最后一步，要么就喝杯茶，再等待 15 分钟__',
      'ai_msg_8',
      6
    )
  ),

  // 11. 第八条 AI 消息：分享教程
  ...mockAIMsg(
    mockContentParts(
      '### 接下来是分享教程，请参考以下步骤，将视频分享到抖音、快手、小红书、B站等平台：',
      'ai_msg_9',
      7
    )
  ),

  // 12. 第九条 AI 消息：分享步骤
  ...mockAIMsg(
    mockContentParts(
      '- 打开抖音、快手、小红书、B站等平台 （视频链接：https://www.douyin.com/video/7333333333333333333 ）\n- 点击分享按钮，选择分享到抖音、快手、小红书、B站等平台',
      'ai_msg_10',
      8
    )
  ),

  // 13. 第十条 AI 消息：加油鼓励
  ...mockAIMsg(
    mockContentParts('__你今天一定能完成棒棒的视频，加油！__', 'ai_msg_11', 9)
  ),

  // 14. 第十一条 AI 消息：生成失败提示
  ...mockAIMsg(
    mockContentParts(
      '> 不好意思 __没看到你的努力分享__ ，视频生成失败，你可以买上边推荐的茶消消气，这边会有工作人员电话骚扰您',
      'ai_msg_12',
      10
    )
  ),
  ...mockAIMsg(mockContentParts('# 再见！！喵喵喵~', 'ai_msg_13', 11)),

  ...mockToolCall(
    {
      tool_id: 'tool_id_1',
      tool_call_id: 'tool_call_id_4',
      tool_display_name: '喵喵喵！！！',
    },
    RunMode.SYNC,
    {
      media_type: MediaType.IMAGE_JPG,
      num: 3,
    },
    mockImages(3, getRandomCatImageUrl)
  ),

  mockChatMsgHandlingEnded(1, '123'),
];
