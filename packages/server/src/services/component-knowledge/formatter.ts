import type { Chunk, ToolCard } from "./types.js";
import { safeLower } from "./utils.js";

function firstMeaningfulLine(text: string | undefined): string {
  if (!text) return "";
  return (
    text
      .split(/\n+/)
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith("别名：") && !line.startsWith("关键词：") && !line.startsWith("同义词：") && !line.startsWith("SearchText：")) || ""
  );
}

function inferComponentKind(card: ToolCard): string {
  const hay = [card.id, card.title, card.summary, card.whenToUse].filter(Boolean).join(" ").toLowerCase();
  if (hay.includes("table") || hay.includes("表格")) return "表格组件";
  if (hay.includes("input") || hay.includes("输入")) return "输入组件";
  if (hay.includes("button") || hay.includes("按钮")) return "按钮组件";
  if (hay.includes("date") || hay.includes("日期")) return "日期组件";
  if (hay.includes("dialog") || hay.includes("弹窗") || hay.includes("对话框")) return "弹窗组件";
  if (hay.includes("message") || hay.includes("确认弹窗")) return "消息弹窗组件";
  if (hay.includes("loading") || hay.includes("加载")) return "加载组件";
  if (hay.includes("map") || hay.includes("地图")) return "地图组件";
  if (hay.includes("video") || hay.includes("视频")) return "视频组件";
  if (hay.includes("file") || hay.includes("文件") || hay.includes("附件")) return "文件组件";
  if (hay.includes("grid") || hay.includes("栅格")) return "栅格布局组件";
  if (hay.includes("info") || hay.includes("信息")) return "信息展示组件";
  return "通用组件";
}

function extractChunkFieldNames(chunks: Chunk[], componentId: string, type: string, limit = 3): string[] {
  const target = chunks.find((chunk) => chunk.component === componentId && safeLower(chunk.type) === safeLower(type));
  if (!target?.text) return [];
  const out: string[] = [];
  for (const line of target.text.split("\n")) {
    const first = line.trim().split(/\s+/)[0];
    if (!first) continue;
    if (first.startsWith("path:")) continue;
    if (!out.includes(first)) out.push(first);
    if (out.length >= limit) break;
  }
  return out;
}

function formatNaturalLanguageComponentList(cards: ToolCard[], chunks: Chunk[]): string[] {
  const lines: string[] = [];
  if (!cards.length) return lines;

  lines.push("可用组件（自然语言概览）：");
  for (const card of cards.slice(0, 6)) {
    const kind = inferComponentKind(card);
    const desc = firstMeaningfulLine(card.summary) || card.title || card.id;
    const useCase = firstMeaningfulLine(card.whenToUse).replace(/^适用场景：/, "");
    const props = extractChunkFieldNames(chunks, card.id, "props");
    const cleanedDesc = desc.replace(/[。；\s]+$/u, "");
    const cleanedUseCase = useCase.replace(/[。；\s]+$/u, "");

    const parts = [`- ${card.id}：${kind}`];
    if (cleanedDesc && cleanedDesc !== card.id && cleanedDesc !== card.title) {
      parts.push(cleanedDesc);
    }
    if (props.length) {
      parts.push(`常用配置如 ${props.join("、")}`);
    }
    if (cleanedUseCase && cleanedUseCase !== cleanedDesc) {
      parts.push(`适合 ${cleanedUseCase}`);
    }
    lines.push(parts.join("，"));
  }

  return lines;
}

export function formatKnowledgeContextFromResult(cards: ToolCard[], chunks: Chunk[]): string {
  if (cards.length === 0 && chunks.length === 0) return "";

  const lines: string[] = [];
  lines.push("【组件库知识（从本地数据集中检索）】");
  lines.push(...formatNaturalLanguageComponentList(cards, chunks));
  if (cards.length) {
    lines.push("Tool Cards（组件概览）：");
    for (const c of cards) {
      lines.push(
        JSON.stringify(
          {
            id: c.id,
            title: c.title,
            summary: c.summary,
            whenToUse: c.whenToUse,
            importHint: c.importHint
          },
          null,
          0
        )
      );
    }
  }
  if (chunks.length) {
    lines.push("Chunks（API/示例片段）：");
    for (const ch of chunks) {
      lines.push(
        JSON.stringify(
          { id: ch.id, component: ch.component, type: ch.type, title: ch.title, text: ch.text },
          null,
          0
        )
      );
    }
  }
  return lines.join("\n");
}
