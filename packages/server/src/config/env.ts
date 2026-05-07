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
  port: Number(process.env.PORT) || 3000,
  apiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  model: (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim(),
  openAiBaseUrl: normalizeOpenAiBaseUrl(
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ),
  httpsProxy: (
    process.env.HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    ""
  ).trim()
};
