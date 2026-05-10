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

function readJsonlFromResources(relativePath: string): RecallCase[] {
  return readJsonl(path.resolve(process.cwd(), "resources", relativePath));
}

/** 10 rounds 用例按分类拆分为多文件，顺序与原先单文件一致。 */
const RECALL_CASES_10_ROUNDS_FILES = [
  {
    relativePath: "recall-cases-10rounds/general-list-form.jsonl",
    title: "通用列表 / 表单控件（general-list-form.jsonl）"
  },
  {
    relativePath: "recall-cases-10rounds/dashboard-workbench.jsonl",
    title: "后台首页 / 工作台 / Dashboard（dashboard-workbench.jsonl）"
  },
  {
    relativePath: "recall-cases-10rounds/admin-detail-page.jsonl",
    title: "后台详情页专项（admin-detail-page.jsonl）"
  },
  {
    relativePath: "recall-cases-10rounds/admin-create-page.jsonl",
    title: "后台新增页专项（admin-create-page.jsonl）"
  },
  {
    relativePath: "recall-cases-10rounds/admin-edit-page.jsonl",
    title: "后台复杂编辑页专项（admin-edit-page.jsonl）"
  }
] as const;

function hasAnyHit(expected: string[], actual: string[]): boolean {
  const actualSet = new Set(actual);
  return expected.some((id) => actualSet.has(id));
}

function runRecallCases(cases: RecallCase[]): RecallSummary {
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

function runRecall(relativeToResources: string): RecallSummary {
  return runRecallCases(readJsonlFromResources(relativeToResources));
}

function runRecall10RoundsMerged(): RecallSummary {
  const cases = RECALL_CASES_10_ROUNDS_FILES.flatMap((entry) => readJsonlFromResources(entry.relativePath));
  return runRecallCases(cases);
}

/** 分片只做「该类内」门禁：条数、零漏、Top8 全覆盖；Top3/Top5 比例以合并全量断言为准（各片难度分布不同）。 */
function assertRecall10RoundsShard(summary: RecallSummary): void {
  expect(summary.totalCases).toBe(100);
  expect(summary.missCount).toBe(0);
  expect(summary.hitAt8 / summary.totalCases).toBe(1);
}

function assertRecall10RoundsMerged(summary: RecallSummary): void {
  expect(summary.totalCases).toBe(500);
  expect(summary.missCount).toBe(0);
  expect(summary.hitAt3 / summary.totalCases).toBeGreaterThanOrEqual(0.96);
  expect(summary.hitAt5 / summary.totalCases).toBeGreaterThanOrEqual(0.995);
  expect(summary.hitAt8 / summary.totalCases).toBe(1);
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

  describe("recall-cases-10rounds（先分片再全量合并）", { timeout: 120000 }, () => {
    for (const { relativePath, title } of RECALL_CASES_10_ROUNDS_FILES) {
      it(`${title}：零漏召回与 Top8 全覆盖`, { timeout: 30000 }, () => {
        assertRecall10RoundsShard(runRecall(relativePath));
      });
    }

    it("分片合并后全量 500 条再跑一遍：零漏召回与稳定 topN", { timeout: 60000 }, () => {
      assertRecall10RoundsMerged(runRecall10RoundsMerged());
    });
  });
});
