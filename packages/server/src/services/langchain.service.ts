import { env } from "../config/env.js";

type LangChainModel = {
  invoke(input: string): Promise<{ content?: unknown }>;
};

async function createChatModel(): Promise<LangChainModel> {
  try {
    const { ChatOpenAI } = await import("@langchain/openai");

    return new ChatOpenAI({
      apiKey: env.apiKey,
      model: env.model,
      configuration: {
        baseURL: env.openAiBaseUrl
      },
      temperature: 0.2
    }) as LangChainModel;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `LangChain ChatOpenAI 初始化失败。请先在 packages/server 安装 @langchain/openai。原始错误: ${message}`
    );
  }
}

function normalizeContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export async function callLangChain(prompt: string): Promise<string> {
  if (!env.apiKey) {
    throw new Error("使用 LangChain 时需要在环境中设置 OPENAI_API_KEY");
  }

  const model = await createChatModel();
  const response = await model.invoke(prompt);
  return normalizeContent(response.content);
}
