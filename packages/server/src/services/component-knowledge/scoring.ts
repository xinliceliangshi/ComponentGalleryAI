import { normalizeWeightedKeywords, keywordsForComponent } from "./keyword-patches.js";
import { normalizeQueryTokens } from "./query.js";
import type { QueryIntent, QueryToken, ToolCard, WeightedKeywordField, WeightedListField, WeightedTextField } from "./types.js";
import { TOOL_CARD_LIST_WEIGHTS, TOOL_CARD_TEXT_WEIGHTS } from "./weights.js";

function scoreText(text: string, tokens: QueryToken[]): number {
  if (!text) return 0;
  const hay = text.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    const word = t.word;
    if (!word) continue;
    const idx = hay.indexOf(word);
    if (idx < 0) continue;
    const base = word.length <= 1 ? 1 : 3;
    score += base;
    if (idx === 0) score += 2;
    else if (idx < 20) score += 1;
  }
  return score;
}

function tokenConfidence(t: QueryToken): number {
  if (t.word.length <= 1) return 0.35 * t.weight;
  if (/^[\u4e00-\u9fff]{2}$/u.test(t.word)) return 0.85 * t.weight;
  if (t.word.length >= 6) return 1.15 * t.weight;
  return t.weight;
}

function categoryBoost(category: string | undefined, intent: QueryIntent | undefined): number {
  if (!category || !intent) return 1;
  return intent.categories[category as keyof QueryIntent["categories"]] ?? 1;
}

function scoreWeightedTextField(field: WeightedTextField, tokens: QueryToken[]): number {
  if (!field.text) return 0;
  const hay = field.text.toLowerCase();
  let score = 0;

  for (const t of tokens) {
    const word = t.word;
    const confidence = tokenConfidence(t);
    if (hay === word) {
      score += (field.exactBoost ?? 0) * confidence;
    } else if (field.prefixBoost && hay.startsWith(word)) {
      score += field.prefixBoost * confidence;
    }

    score += scoreText(hay, [t]) * field.weight * confidence;
  }

  return score;
}

function scoreWeightedListField(field: WeightedListField, tokens: QueryToken[]): number {
  const values = field.values?.filter(Boolean);
  if (!values?.length) return 0;

  let score = 0;
  const normalizedValues = values.map((v) => v.toLowerCase());
  const joined = normalizedValues.join("\n");

  for (const t of tokens) {
    const word = t.word;
    const confidence = tokenConfidence(t);
    if (normalizedValues.includes(word)) {
      score += (field.exactBoost ?? 0) * confidence;
    }
    score += scoreText(joined, [t]) * field.weight * confidence;
  }

  return score;
}

function scoreWeightedKeywordField(field: WeightedKeywordField, tokens: QueryToken[], intent?: QueryIntent): number {
  const values = normalizeWeightedKeywords(field.values);
  if (!values.length) return 0;

  let score = 0;
  for (const item of values) {
    const word = item.word.toLowerCase();
    const boost = categoryBoost(item.category, intent);
    for (const t of tokens) {
      const tokenWord = t.word;
      const confidence = tokenConfidence(t);
      if (word === tokenWord) {
        score += (field.exactBoost ?? 0) * item.weight * confidence * boost;
      }
      score += scoreText(word, [t]) * field.weight * item.weight * confidence * boost;
    }
  }

  return score;
}

export function scoreWeightedFields(
  textFields: WeightedTextField[],
  listFields: WeightedListField[],
  tokens: QueryToken[],
  keywordFields: WeightedKeywordField[] = [],
  intent?: QueryIntent
): number {
  const tks = normalizeQueryTokens(tokens);
  if (!tks.length) return 0;

  return (
    textFields.reduce((sum, field) => sum + scoreWeightedTextField(field, tks), 0) +
    listFields.reduce((sum, field) => sum + scoreWeightedListField(field, tks), 0) +
    keywordFields.reduce((sum, field) => sum + scoreWeightedKeywordField(field, tks, intent), 0)
  );
}

export function scoreToolCard(card: ToolCard, tokens: QueryToken[], intent?: QueryIntent): number {
  const keywords = keywordsForComponent(card.id, card.keywords);

  return scoreWeightedFields(
    [
      { text: card.id, ...TOOL_CARD_TEXT_WEIGHTS.id },
      { text: card.title, ...TOOL_CARD_TEXT_WEIGHTS.title },
      { text: card.name, ...TOOL_CARD_TEXT_WEIGHTS.name },
      { text: card.searchText, ...TOOL_CARD_TEXT_WEIGHTS.searchText },
      { text: card.summary, ...TOOL_CARD_TEXT_WEIGHTS.summary },
      { text: card.whenToUse, ...TOOL_CARD_TEXT_WEIGHTS.whenToUse },
      { text: card.importHint, ...TOOL_CARD_TEXT_WEIGHTS.importHint }
    ],
    [
      { values: card.aliases, ...TOOL_CARD_LIST_WEIGHTS.aliases },
      { values: card.searchTokens, ...TOOL_CARD_LIST_WEIGHTS.searchTokens },
      { values: card.capabilities, ...TOOL_CARD_LIST_WEIGHTS.capabilities },
      { values: card.scenarios, ...TOOL_CARD_LIST_WEIGHTS.scenarios }
    ],
    tokens,
    [{ values: keywords, ...TOOL_CARD_LIST_WEIGHTS.keywords }],
    intent
  );
}
