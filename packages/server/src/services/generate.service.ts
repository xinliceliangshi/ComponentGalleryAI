import { buildPrompt } from "./prompt.service.js";
import { callLLM } from "./llm.service.js";
import { safeJsonParse } from "../utils/safe-json.js";
import { GenerateSchema } from "../schemas/generate.schema.js";

export async function generateService(input: string) {
  const prompt = buildPrompt(input); // 构建提示词

  const raw = await callLLM(prompt); // 调用LLM
  const parsed = safeJsonParse(raw); // 解析JSON
  return GenerateSchema.parse(parsed); // 返回结果
}
