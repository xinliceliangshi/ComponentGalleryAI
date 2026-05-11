import { loadKnowledgeDb } from "./component-knowledge/db.js";
import { applyDedupeWeight, cardDedupeKey, chunkDedupeKey } from "./component-knowledge/diversity.js";
import { formatKnowledgeContextFromResult } from "./component-knowledge/formatter.js";
import { buildQueryTokens, inferQueryIntent } from "./component-knowledge/query.js";
import { scoreToolCard, scoreWeightedFields } from "./component-knowledge/scoring.js";
import type { Chunk, ToolCard } from "./component-knowledge/types.js";
import { safeLower } from "./component-knowledge/utils.js";
import { CHUNK_TEXT_WEIGHTS, DEDUPE_WEIGHTS } from "./component-knowledge/weights.js";
import { buildDecompositionQueries, type RequirementDecomposition } from "./requirement-decomposition.service.js";
import { SECTION_QUERY_HINTS } from "./requirement-decomposition/section-query-hints.js";
import type { RequirementSection } from "./requirement-decomposition/types.js";

export { loadKnowledgeDb };
export { formatKnowledgeContextFromResult };

export type SectionKnowledge = {
  section: RequirementSection;
  queries: string[];
  cards: ToolCard[];
  chunks: Chunk[];
};

export function retrieveKnowledgeForQuery(query: string, options?: { maxCards?: number; maxChunks?: number }) {
  const db = loadKnowledgeDb();
  if (!db) return { cards: [] as ToolCard[], chunks: [] as Chunk[] };

  const tokens = buildQueryTokens(query);
  const intent = inferQueryIntent(query);
  const maxCards = Math.max(0, options?.maxCards ?? 8);
  const maxChunks = Math.max(0, options?.maxChunks ?? 6);

  const scoredCards = db.toolCards
    .map((c) => {
      return { item: c, score: scoreToolCard(c, tokens, intent) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const pickedCards = applyDedupeWeight(scoredCards, cardDedupeKey, DEDUPE_WEIGHTS.cardFamilyPenalty)
    .slice(0, maxCards)
    .map((x) => x.item);

  const pickedIds = new Set(pickedCards.map((c) => c.id));

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
      return { item: ch, score: baseScore + boost + typeBoost };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const pickedChunks = applyDedupeWeight(scoredChunks, chunkDedupeKey, DEDUPE_WEIGHTS.chunkComponentPenalty)
    .slice(0, maxChunks)
    .map((x) => x.item);

  return { cards: pickedCards, chunks: pickedChunks };
}

export function formatKnowledgeContext(input: string): string {
  const { cards, chunks } = retrieveKnowledgeForQuery(input);
  return formatKnowledgeContextFromResult(cards, chunks);
}

export function retrieveKnowledgeForDecomposition(
  input: string,
  decomposition: RequirementDecomposition,
  options?: { maxCards?: number; maxChunks?: number }
) {
  const maxCards = Math.max(0, options?.maxCards ?? 10);
  const maxChunks = Math.max(0, options?.maxChunks ?? 8);
  const queries = buildDecompositionQueries(input, decomposition);
  const cardMap = new Map<string, ToolCard>();
  const chunkMap = new Map<string, Chunk>();

  for (const query of queries) {
    const result = retrieveKnowledgeForQuery(query, {
      maxCards: Math.max(4, Math.ceil(maxCards / 2)),
      maxChunks: Math.max(3, Math.ceil(maxChunks / 2))
    });

    for (const card of result.cards) {
      if (!cardMap.has(card.id)) cardMap.set(card.id, card);
    }
    for (const chunk of result.chunks) {
      if (!chunkMap.has(chunk.id)) chunkMap.set(chunk.id, chunk);
    }
  }

  return {
    cards: Array.from(cardMap.values()).slice(0, maxCards),
    chunks: Array.from(chunkMap.values()).slice(0, maxChunks)
  };
}

function buildSectionQueries(section: RequirementSection): string[] {
  return Array.from(new Set([
    [section.kind, section.intent, section.layout, section.uiRegion].filter(Boolean).join(" "),
    section.sourceSubtaskId ? `${section.kind} ${section.sourceSubtaskId}` : "",
    ...(SECTION_QUERY_HINTS[section.kind] ?? [])
  ].map((query) => query.trim()).filter(Boolean)));
}

export function retrieveKnowledgeForSection(
  section: RequirementSection,
  options?: { maxCards?: number; maxChunks?: number }
): SectionKnowledge {
  const maxCards = Math.max(0, options?.maxCards ?? 6);
  const maxChunks = Math.max(0, options?.maxChunks ?? 4);
  const queries = buildSectionQueries(section);
  const cardMap = new Map<string, ToolCard>();
  const chunkMap = new Map<string, Chunk>();

  for (const query of queries) {
    const result = retrieveKnowledgeForQuery(query, {
      maxCards: Math.max(3, Math.ceil(maxCards / 2)),
      maxChunks: Math.max(2, Math.ceil(maxChunks / 2))
    });

    for (const card of result.cards) {
      if (!cardMap.has(card.id)) cardMap.set(card.id, card);
    }
    for (const chunk of result.chunks) {
      if (!chunkMap.has(chunk.id)) chunkMap.set(chunk.id, chunk);
    }
  }

  return {
    section,
    queries,
    cards: Array.from(cardMap.values()).slice(0, maxCards),
    chunks: Array.from(chunkMap.values()).slice(0, maxChunks)
  };
}

export function retrieveKnowledgeForSections(
  decomposition: RequirementDecomposition,
  options?: { maxCardsPerSection?: number; maxChunksPerSection?: number }
): SectionKnowledge[] {
  if (!decomposition.sections?.length) return [];

  return decomposition.sections.map((section) =>
    retrieveKnowledgeForSection(section, {
      maxCards: options?.maxCardsPerSection,
      maxChunks: options?.maxChunksPerSection
    })
  );
}

export function formatKnowledgeContextForDecomposition(
  input: string,
  decomposition: RequirementDecomposition
): string {
  if (!decomposition.enabled) return formatKnowledgeContext(input);

  const { cards, chunks } = retrieveKnowledgeForDecomposition(input, decomposition);
  return formatKnowledgeContextFromResult(cards, chunks);
}
