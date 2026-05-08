import { buildPrompt } from "./prompt.service.js";
import { callLLM } from "./llm.service.js";
import { safeJsonParse } from "../utils/safe-json.js";
import { GenerateSchema } from "../schemas/generate.schema.js";
import { decomposeRequirement } from "./requirement-decomposition.service.js";
import { formatKnowledgeContextForDecomposition } from "./component-knowledge.service.js";

export async function generateService(input: string) {
  const decomposition = decomposeRequirement(input); // 大需求先做规则式拆分
  const knowledge = formatKnowledgeContextForDecomposition(input, decomposition); // 按子任务合并召回
  const prompt = buildPrompt(input, { decomposition, knowledge }); // 构建提示词

  const raw = await callLLM(prompt); // 调用LLM
  const parsed = safeJsonParse(raw); // 解析JSON
  return GenerateSchema.parse(parsed); // 返回结果
}
