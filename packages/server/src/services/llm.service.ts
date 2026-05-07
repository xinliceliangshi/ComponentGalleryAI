import { env } from "../config/env.js";

export type OpenAiConfigForLlm = {
  apiKey: string;
  model: string;
  openAiBaseUrl: string;
};

/** 显式 openai → OpenAI；显式 deepseek → DeepSeek；未设置时只要有 DeepSeek Key 就用 DeepSeek，否则 OpenAI。 */
export function resolveLlmFromEnv(
  envMap: NodeJS.ProcessEnv,
  openai: OpenAiConfigForLlm
): { url: string; key: string; model: string } {
  const explicit = (envMap.LLM_PROVIDER ?? "").trim().toLowerCase();
  const deepseekKey = (envMap.DEEPSEEK_API_KEY ?? "").trim();
  const deepseekModel = (envMap.DEEPSEEK_MODEL ?? "deepseek-chat").trim();

  const useDeepseek =
    explicit === "openai"
      ? false
      : explicit === "deepseek"
        ? true
        : Boolean(deepseekKey);

  if (useDeepseek) {
    if (!deepseekKey) {
      throw new Error(
        "使用 DeepSeek 时需要设置 DEEPSEEK_API_KEY，或将 LLM_PROVIDER 设为 openai"
      );
    }
    return {
      url: "https://api.deepseek.com/v1/chat/completions",
      key: deepseekKey,
      model: deepseekModel
    };
  }

  if (!openai.apiKey) {
    throw new Error("使用 OpenAI 时需要在环境中设置 OPENAI_API_KEY");
  }

  const base = openai.openAiBaseUrl.replace(/\/+$/, "") || "https://api.openai.com/v1";
  return {
    url: `${base}/chat/completions`,
    key: openai.apiKey,
    model: openai.model
  };
}

function resolveLlm(): ReturnType<typeof resolveLlmFromEnv> {
  return resolveLlmFromEnv(process.env, {
    apiKey: env.apiKey,
    model: env.model,
    openAiBaseUrl: env.openAiBaseUrl
  });
}

export async function callLLM(prompt: string) {
  const { url, key, model } = resolveLlm();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    const hint = data.error?.message ?? res.statusText;
    throw new Error(`LLM 请求失败 (${res.status}): ${hint}`);
  }

  return data.choices?.[0]?.message?.content ?? "";
}
