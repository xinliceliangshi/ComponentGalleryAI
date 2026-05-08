# Top-N Retrieval Roadmap

This project evolves Top-N retrieval in five stages:

1. v1: Keyword matching.
2. v2: Weighted keyword scoring.
3. v3: Category-aware retrieval with intent understanding.
4. v4: Query expansion with synonyms and semantic enrichment.
5. v5: Ranking optimization closer to a recommendation system.

Current focus: v2, replacing flat keyword matching with weighted scoring by field and token confidence.

v2 implementation notes:

- Step 1: Support `keywords` as either `string[]` or weighted keyword objects.
- Step 2: Add categorized keyword patches for high-value component recall terms.

v3 implementation note:

- Step 1: Infer lightweight query intent and conservatively boost matching keyword categories.

v4 implementation note:

- Step 1: Add deterministic query expansion with lower-weight synonym tokens.
