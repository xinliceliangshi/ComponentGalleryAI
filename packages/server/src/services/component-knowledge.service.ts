import { loadKnowledgeDb } from "./component-knowledge/db.js";
import { formatKnowledgeContextFromResult } from "./component-knowledge/formatter.js";
import { buildQueryTokens, inferQueryIntent } from "./component-knowledge/query.js";
import { scoreToolCard, scoreWeightedFields } from "./component-knowledge/scoring.js";
import type { Chunk, ToolCard } from "./component-knowledge/types.js";
import { safeLower } from "./component-knowledge/utils.js";
import { CHUNK_TEXT_WEIGHTS } from "./component-knowledge/weights.js";

export { loadKnowledgeDb };

export function retrieveKnowledgeForQuery(query: string, options?: { maxCards?: number; maxChunks?: number }) {
  const db = loadKnowledgeDb();
  if (!db) return { cards: [] as ToolCard[], chunks: [] as Chunk[] };

  const tokens = buildQueryTokens(query);
  const intent = inferQueryIntent(query);
  const maxCards = Math.max(0, options?.maxCards ?? 8);
  const maxChunks = Math.max(0, options?.maxChunks ?? 6);

  const scoredCards = db.toolCards
    .map((c) => {
      return { c, s: scoreToolCard(c, tokens, intent) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, maxCards)
    .map((x) => x.c);

  const pickedIds = new Set(scoredCards.map((c) => c.id));

  const scoredChunks = db.chunks
    .map((ch) => {
      const baseScore = scoreWeightedFields(
        [
          { text: ch.component, ...CHUNK_TEXT_WEIGHTS.component },
          { text: ch.title, ...CHUNK_TEXT_WEIGHTS.title },
          { text: ch.type, ...CHUNK_TEXT_WEIGHTS.type },
          { text: ch.text, ...CHUNK_TEXT_WEIGHTS.text }
        ],
        [],
        tokens
      );
      const boost = ch.component && pickedIds.has(ch.component) ? 6 : 0;
      const typeBoost = safeLower(ch.type).includes("example") ? 2 : 0;
      return { ch, s: baseScore + boost + typeBoost };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, maxChunks)
    .map((x) => x.ch);

  return { cards: scoredCards, chunks: scoredChunks };
}

export function formatKnowledgeContext(input: string): string {
  const { cards, chunks } = retrieveKnowledgeForQuery(input);
  return formatKnowledgeContextFromResult(cards, chunks);
}
