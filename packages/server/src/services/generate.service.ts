import { buildPrompt } from "./prompt.service.js";
import { callLLM } from "./llm.service.js";
import { safeJsonParse } from "../utils/safe-json.js";
import { GenerateSchema } from "../schemas/generate.schema.js";
import { decomposeRequirement } from "./requirement-decomposition.service.js";
import {
  formatKnowledgeContext,
  formatKnowledgeContextFromResult,
  retrieveKnowledgeForSections,
  retrieveKnowledgeForDecomposition
} from "./component-knowledge.service.js";
import { buildGenerationPlan } from "./generation-plan.service.js";

export async function generateService(input: string) {
  const decomposition = decomposeRequirement(input); // 大需求先做规则式拆分
  const knowledgeResult = decomposition.enabled
    ? retrieveKnowledgeForDecomposition(input, decomposition)
    : undefined;
  const knowledge = knowledgeResult
    ? formatKnowledgeContextFromResult(knowledgeResult.cards, knowledgeResult.chunks)
    : formatKnowledgeContext(input);
  const sectionKnowledge = decomposition.enabled ? retrieveKnowledgeForSections(decomposition) : [];
  const generationPlan = knowledgeResult
    ? buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge })
    : undefined;
  const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge }); // 构建提示词

  const raw = await callLLM(prompt); // 调用LLM
  const parsed = safeJsonParse(raw); // 解析JSON
  return GenerateSchema.parse(parsed); // 返回结果
}
