import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { retrieveKnowledgeForQuery } from "../src/services/component-knowledge.service.js";

type Case = {
  query: string;
  expectIds: string[];
  notes?: string;
};

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args.set(key, next);
      i++;
    } else {
      args.set(key, "true");
    }
  }
  return {
    file: args.get("file") || path.join(serverRoot, "resources/recall-cases.jsonl"),
    kCards: Math.max(1, Number(args.get("kCards") || "8")),
    kChunks: Math.max(1, Number(args.get("kChunks") || "6")),
    topN: String(args.get("topN") || "1,3,5,8").split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0),
    metric: (args.get("metric") || "all").trim().toLowerCase(),
    verbose: args.get("verbose") === "true"
  };
}

function readJsonl(filePath: string): Case[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`cases file not found: ${filePath}`);
  }
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const out: Case[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    out.push(JSON.parse(l) as Case);
  }
  return out;
}

function intersect(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function main() {
  const { file, kCards, kChunks, topN, metric, verbose } = parseArgs(process.argv);
  const cases = readJsonl(file);
  if (!cases.length) throw new Error(`no cases in: ${file}`);

  const uniqTopN = Array.from(new Set(topN)).sort((a, b) => a - b);
  const hitAtCards = new Map<number, number>();
  const hitAtChunks = new Map<number, number>();
  const hitAtEither = new Map<number, number>();
  for (const n of uniqTopN) {
    hitAtCards.set(n, 0);
    hitAtChunks.set(n, 0);
    hitAtEither.set(n, 0);
  }

  const misses: Array<{
    query: string;
    expectIds: string[];
    gotCardIds: string[];
    gotChunkComponentIds: string[];
  }> = [];

  for (const c of cases) {
    const { cards, chunks } = retrieveKnowledgeForQuery(c.query, { maxCards: kCards, maxChunks: kChunks });
    const gotCardIds = cards.map((x) => x.id);
    const gotChunkComponentIds = chunks.map((x) => x.component).filter(Boolean) as string[];

    for (const n of uniqTopN) {
      const topCardIds = gotCardIds.slice(0, n);
      const topChunkComponentIds = gotChunkComponentIds.slice(0, n);
      const cardHitN = intersect(c.expectIds, topCardIds).length > 0;
      const chunkHitN = intersect(c.expectIds, topChunkComponentIds).length > 0;
      const eitherHitN = cardHitN || chunkHitN;
      if (cardHitN) hitAtCards.set(n, (hitAtCards.get(n) || 0) + 1);
      if (chunkHitN) hitAtChunks.set(n, (hitAtChunks.get(n) || 0) + 1);
      if (eitherHitN) hitAtEither.set(n, (hitAtEither.get(n) || 0) + 1);
    }

    const cardHit = intersect(c.expectIds, gotCardIds).length > 0;
    const chunkHit = intersect(c.expectIds, gotChunkComponentIds).length > 0;
    const eitherHit = cardHit || chunkHit;

    if (!eitherHit) {
      misses.push({ query: c.query, expectIds: c.expectIds, gotCardIds, gotChunkComponentIds });
    } else if (verbose) {
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify(
          {
            query: c.query,
            expectIds: c.expectIds,
            gotCardIds,
            gotChunkComponentIds
          },
          null,
          0
        )
      );
    }
  }

  const total = cases.length;
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  const topNResult = uniqTopN.map((n) => ({
    n,
    cards: { hitCases: hitAtCards.get(n) || 0, rate: pct(hitAtCards.get(n) || 0) },
    chunks: { hitCases: hitAtChunks.get(n) || 0, rate: pct(hitAtChunks.get(n) || 0) },
    either: { hitCases: hitAtEither.get(n) || 0, rate: pct(hitAtEither.get(n) || 0) }
  }));

  const topNOut =
    metric === "cards"
      ? topNResult.map((x) => ({ n: x.n, cards: x.cards }))
      : metric === "either"
        ? topNResult.map((x) => ({ n: x.n, either: x.either }))
        : metric === "chunks"
          ? topNResult.map((x) => ({ n: x.n, chunks: x.chunks }))
          : topNResult;

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        totalCases: total,
        kCards,
        kChunks,
        metric,
        topN: topNOut,
        missCount: misses.length,
        misses: misses.slice(0, 30)
      },
      null,
      2
    )
  );
}

main();
