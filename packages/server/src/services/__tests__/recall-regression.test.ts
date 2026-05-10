import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { retrieveKnowledgeForQuery } from "../component-knowledge.service.js";

type RecallCase = {
  query: string;
  expectIds: string[];
};

type RecallSummary = {
  totalCases: number;
  hitAt1: number;
  hitAt3: number;
  hitAt5: number;
  hitAt8: number;
  missCount: number;
  misses: string[];
};

function readJsonl(filePath: string): RecallCase[] {
  return fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => JSON.parse(line) as RecallCase);
}

function hasAnyHit(expected: string[], actual: string[]): boolean {
  const actualSet = new Set(actual);
  return expected.some((id) => actualSet.has(id));
}

function runRecall(fileName: string): RecallSummary {
  const filePath = path.resolve(process.cwd(), "resources", fileName);
  const cases = readJsonl(filePath);
  let hitAt1 = 0;
  let hitAt3 = 0;
  let hitAt5 = 0;
  let hitAt8 = 0;
  const misses: string[] = [];

  for (const testCase of cases) {
    const result = retrieveKnowledgeForQuery(testCase.query, { maxCards: 8, maxChunks: 6 });
    const cardIds = result.cards.map((card) => card.id);
    const chunkIds = result.chunks.map((chunk) => chunk.component).filter(Boolean) as string[];

    const hitWithin = (n: number) =>
      hasAnyHit(testCase.expectIds, cardIds.slice(0, n)) || hasAnyHit(testCase.expectIds, chunkIds.slice(0, n));

    if (hitWithin(1)) hitAt1++;
    if (hitWithin(3)) hitAt3++;
    if (hitWithin(5)) hitAt5++;
    if (hitWithin(8)) {
      hitAt8++;
    } else {
      misses.push(testCase.query);
    }
  }

  return {
    totalCases: cases.length,
    hitAt1,
    hitAt3,
    hitAt5,
    hitAt8,
    missCount: misses.length,
    misses
  };
}

describe("recall regression", () => {
  it("recall-cases.jsonl 保持零漏召回和稳定 topN", { timeout: 30000 }, () => {
    const summary = runRecall("recall-cases.jsonl");

    expect(summary.totalCases).toBe(316);
    expect(summary.missCount).toBe(0);
    expect(summary.hitAt3 / summary.totalCases).toBeGreaterThanOrEqual(0.97);
    expect(summary.hitAt5 / summary.totalCases).toBe(1);
    expect(summary.hitAt8 / summary.totalCases).toBe(1);
  });

  it("recall-cases-10rounds.jsonl 保持零漏召回和稳定 topN", { timeout: 30000 }, () => {
    const summary = runRecall("recall-cases-10rounds.jsonl");

    expect(summary.totalCases).toBe(400);
    expect(summary.missCount).toBe(0);
    expect(summary.hitAt3 / summary.totalCases).toBeGreaterThanOrEqual(0.96);
    expect(summary.hitAt5 / summary.totalCases).toBeGreaterThanOrEqual(0.995);
    expect(summary.hitAt8 / summary.totalCases).toBe(1);
  });
});
