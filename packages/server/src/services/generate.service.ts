import { buildPrompt } from "./prompt.service.js";
import { callLangChain } from "./langchain.service.js";
import { safeJsonParse } from "../utils/safe-json.js";
import { GenerateSchema } from "../schemas/generate.schema.js";
import { decomposeRequirement } from "./requirement-decomposition.service.js";
import {
  formatKnowledgeContextHybrid,
  formatKnowledgeContextFromResult,
  retrieveKnowledgeForSectionsHybrid,
  retrieveKnowledgeForDecompositionHybrid
} from "./component-knowledge.service.js";
import { buildGenerationPlan } from "./generation-plan.service.js";

export async function generateService(input: string) {
  const decomposition = decomposeRequirement(input); // 大需求先做规则式拆分
  const knowledgeResult = decomposition.enabled
    ? await retrieveKnowledgeForDecompositionHybrid(input, decomposition)
    : undefined;
  const knowledge = knowledgeResult
    ? formatKnowledgeContextFromResult(knowledgeResult.cards, knowledgeResult.chunks)
    : await formatKnowledgeContextHybrid(input);
  const sectionKnowledge = decomposition.enabled ? await retrieveKnowledgeForSectionsHybrid(decomposition) : [];
  const generationPlan = knowledgeResult
    ? buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge })
    : undefined;
  const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge }); // 构建提示词

  const raw = await callLangChain(prompt); // 调用LLM
  const parsed = safeJsonParse(raw); // 解析JSON
  return GenerateSchema.parse(parsed); // 返回结果
}
