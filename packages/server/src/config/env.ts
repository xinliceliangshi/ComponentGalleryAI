import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

function normalizeOpenAiBaseUrl(raw: string): string {
  const u = raw.trim().replace(/\/+$/, "");
  return u || "https://api.openai.com/v1";
}

export const env = {
  port: Number(process.env.PORT) || 3002,
  apiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  model: (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim(),
  openAiBaseUrl: normalizeOpenAiBaseUrl(
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ),
  httpsProxy: (
    process.env.HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    ""
  ).trim(),
  /**
   * 组件知识库数据目录：包含 tool-cards.json / component-chunks.jsonl 等。
   * 支持指向外部项目生成目录（例如 zhihao-ui）。
   */
  componentDataDir: (process.env.COMPONENT_GALLERY_AI_DATA_DIR ?? "").trim(),
  /**
   * 实验性：直接读取生成出的 components.*.json 做检索/筛选试验。
   * - raw 更偏“全量原始信息”
   * - search 更偏“可检索结构化信息（props/methods/events/slots/examples 等）”
   */
  componentRawJsonPath: (process.env.COMPONENT_GALLERY_AI_COMPONENTS_RAW_JSON ?? "").trim(),
  componentSearchJsonPath: (process.env.COMPONENT_GALLERY_AI_COMPONENTS_SEARCH_JSON ?? "").trim(),
  /**
   * legacy: 现有 tool-cards.json + component-chunks.jsonl
   * search_json: 仅使用 components.search.json
   * hybrid: legacy + search_json 合并（去重）
   */
  componentKnowledgeMode: (process.env.COMPONENT_GALLERY_AI_KNOWLEDGE_MODE ?? "legacy").trim()
};
