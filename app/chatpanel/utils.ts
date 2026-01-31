/**
 * 工具函数
 */

// 简化的 ULID 生成器
let counter = 0;
export function scopedULID(scope: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  counter++;
  return `${scope}_${timestamp}${random}${counter.toString(36)}`;
}

// 随机图片 URL 生成器
export function getRandomImageUrl(): string {
  return `https://picsum.photos/seed/${Math.random()}/300/300`;
}

// 随机猫咪图片 URL 生成器
export function getRandomCatImageUrl(): string {
  return 'https://cataas.com/cat/gif';
}

// Markdown 示例内容
export const exampleContent = `# 🎵 "天空之镜" 配乐完整指南

## 🎼 按视频段落配乐方案

---

### 【开场部分】0:00-0:30

#### 推荐风格：空灵、神秘、大气

**具体曲目推荐：**

1. **"Weightless" - Marconi Union**
   - 风格：环境音乐
   - 特点：极度放松，被称为"世界上最放松的音乐"

2. **"Opening" - Philip Glass**
   - 风格：极简主义古典
   - 特点：重复性旋律，营造冥想感

**音效叠加：**
- 轻微风声 (音量10%)
- 水波涟漪声
- 远处鸟鸣

---

### 【探索部分】0:30-1:30

#### 推荐风格：轻快、充满好奇、节奏渐强

**具体曲目推荐：**

1. **"River Flows in You" - Yiruma**
   - 风格：抒情钢琴
   - 特点：温柔流畅，情感细腻
`;

// 加载测试 Markdown 内容
export function loadTestMd(): string {
  return exampleContent;
}
