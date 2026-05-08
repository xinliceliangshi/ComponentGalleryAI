import type { Chunk, ToolCard } from "./types.js";

const CARD_DEDUPE_FAMILY_BY_ID: Record<string, string> = {
  ZhTable: "data-table",
  ZhDiyDataTable: "data-table",
  ZhButton: "button-action",
  ZhButtonGroup: "button-action",
  ZhDialog: "dialog-confirm",
  ZhMessageBox: "dialog-confirm",
  ZhBaseInfo: "info-display",
  ZhBaseItem: "info-display",
  ZhInfoPair: "info-display",
  ZhEditInfoPair: "info-display"
};

type Scored<T> = {
  item: T;
  score: number;
};

export function cardDedupeKey(card: ToolCard): string {
  return CARD_DEDUPE_FAMILY_BY_ID[card.id] ?? card.id;
}

export function chunkDedupeKey(chunk: Chunk): string {
  return chunk.component || chunk.id;
}

export function applyDedupeWeight<T>(items: Scored<T>[], keyOf: (item: T) => string, penalty: number): Scored<T>[] {
  const seen = new Map<string, number>();
  return items
    .map((entry, index) => {
      const key = keyOf(entry.item);
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      return {
        item: entry.item,
        score: entry.score * Math.pow(penalty, count),
        originalIndex: index
      };
    })
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .map(({ item, score }) => ({ item, score }));
}
