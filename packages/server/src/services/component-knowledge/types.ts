export type KeywordCategory = "component" | "scenario" | "feature" | "prop" | "event" | "action" | "visual" | "layout";

export type WeightedKeyword = {
  word: string;
  weight: number;
  category?: KeywordCategory | string;
};

export type KeywordInput = string | WeightedKeyword;

export type ToolCard = {
  id: string;
  name?: string;
  title?: string;
  aliases?: string[];
  keywords?: KeywordInput[];
  scenarios?: string[];
  capabilities?: string[];
  searchText?: string;
  searchTokens?: string[];
  summary?: string;
  whenToUse?: string;
  importHint?: string;
  keyFiles?: string[];
};

export type Chunk = {
  id: string;
  component?: string;
  type?: string;
  title?: string;
  text: string;
};

export type KnowledgeDb = {
  toolCards: ToolCard[];
  chunks: Chunk[];
};

export type SearchComponent = {
  id: string;
  title?: string;
  description?: string;
  aliases?: string[];
  keywords?: KeywordInput[];
  scenarios?: string[];
  capabilities?: string[];
  searchText?: string;
  searchTokens?: string[];
  props?: Array<{ name?: string; description?: string; type?: string; default?: string; required?: string }>;
  methods?: Array<{ name?: string; description?: string; signature?: string }>;
  events?: Array<{ name?: string; description?: string }>;
  slots?: Array<{ name?: string; description?: string }>;
  examples?: Array<{ title?: string; description?: string; path?: string }>;
  files?: string[];
};

export type QueryIntent = {
  categories: Partial<Record<KeywordCategory, number>>;
};

export type QueryToken = {
  word: string;
  weight: number;
  source: "original" | "expanded";
};

export type WeightedTextField = {
  text?: string;
  weight: number;
  exactBoost?: number;
  prefixBoost?: number;
};

export type WeightedListField = {
  values?: string[];
  weight: number;
  exactBoost?: number;
};

export type WeightedKeywordField = {
  values?: KeywordInput[];
  weight: number;
  exactBoost?: number;
};
