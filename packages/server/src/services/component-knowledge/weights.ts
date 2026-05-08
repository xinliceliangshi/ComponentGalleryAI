import type { WeightedListField, WeightedTextField } from "./types.js";

export const TOOL_CARD_TEXT_WEIGHTS = {
  id: { weight: 4.2, exactBoost: 25, prefixBoost: 10 },
  title: { weight: 3.5, exactBoost: 14, prefixBoost: 5 },
  name: { weight: 3.5, exactBoost: 18, prefixBoost: 7 },
  searchText: { weight: 2.5 },
  summary: { weight: 2.0 },
  whenToUse: { weight: 1.3 },
  importHint: { weight: 0.6 }
} satisfies Record<string, Omit<WeightedTextField, "text">>;

export const TOOL_CARD_LIST_WEIGHTS = {
  aliases: { weight: 4.0, exactBoost: 18 },
  keywords: { weight: 3.6, exactBoost: 14 },
  searchTokens: { weight: 3.4, exactBoost: 12 },
  capabilities: { weight: 2.8, exactBoost: 8 },
  scenarios: { weight: 2.2, exactBoost: 6 }
} satisfies Record<string, Omit<WeightedListField, "values">>;

export const CHUNK_TEXT_WEIGHTS = {
  component: { weight: 3.2, exactBoost: 12, prefixBoost: 5 },
  title: { weight: 2.2, exactBoost: 8, prefixBoost: 3 },
  type: { weight: 1.5, exactBoost: 5 },
  text: { weight: 1.0 }
} satisfies Record<string, Omit<WeightedTextField, "text">>;

export const DEDUPE_WEIGHTS = {
  cardFamilyPenalty: 0.92,
  chunkComponentPenalty: 0.72
};
