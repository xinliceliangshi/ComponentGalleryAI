import { callLangChain } from "../src/services/langchain.service.js";
import { GenerateSchema } from "../src/schemas/generate.schema.js";
import { safeJsonParse } from "../src/utils/safe-json.js";

type FailureStage = "invoke" | "json" | "schema";

type RunResult =
  | {
      ok: true;
      durationMs: number;
      componentCount: number;
      codeLength: number;
    }
  | {
      ok: false;
      durationMs: number;
      stage: FailureStage;
      error: string;
    };

const prompt = `
你是一个资深前端工程师，擅长 Vue / React 和组件库。

请返回 JSON：
{
  "components": [
    { "name": "", "usage": "" }
  ],
  "explanation": "",
  "code": ""
}

要求：
- 只返回 JSON
- code 必须完整
- 不要 markdown

用户需求：
生成一个后台列表页，包含筛选区、表格区和分页区，优先使用已有组件库能力。
`.trim();

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

async function runOnce(index: number): Promise<RunResult> {
  const startedAt = Date.now();

  let raw = "";
  try {
    raw = await callLangChain(prompt);
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      stage: "invoke",
      error: error instanceof Error ? error.message : String(error)
    };
  }

  let parsed: unknown;
  try {
    parsed = safeJsonParse(raw);
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      stage: "json",
      error: error instanceof Error ? error.message : String(error)
    };
  }

  try {
    const result = GenerateSchema.parse(parsed);
    return {
      ok: true,
      durationMs: Date.now() - startedAt,
      componentCount: result.components.length,
      codeLength: result.code.length
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      stage: "schema",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function summarize(results: RunResult[]) {
  const success = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);
  const stageCounts = failed.reduce<Record<string, number>>((acc, result) => {
    if (!result.ok) acc[result.stage] = (acc[result.stage] ?? 0) + 1;
    return acc;
  }, {});

  const durations = success.map((result) => result.durationMs);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  return {
    total: results.length,
    success: success.length,
    failed: failed.length,
    successRate: results.length ? `${((success.length / results.length) * 100).toFixed(1)}%` : "0.0%",
    avgDurationMs: avgDuration,
    failureStages: stageCounts
  };
}

async function main() {
  const rounds = parsePositiveInt(process.env.LANGCHAIN_SMOKE_ROUNDS, 5);

  console.log(`LangChain smoke test started. rounds=${rounds}`);

  const results: RunResult[] = [];
  for (let i = 0; i < rounds; i += 1) {
    const result = await runOnce(i + 1);
    results.push(result);

    if (result.ok) {
      console.log(
        `[${i + 1}/${rounds}] ok duration=${result.durationMs}ms components=${result.componentCount} codeLength=${result.codeLength}`
      );
    } else {
      console.log(
        `[${i + 1}/${rounds}] fail stage=${result.stage} duration=${result.durationMs}ms error=${result.error}`
      );
    }
  }

  const summary = summarize(results);
  console.log("");
  console.log("Summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
