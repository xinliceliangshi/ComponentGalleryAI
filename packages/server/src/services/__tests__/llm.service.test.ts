import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { OpenAiConfigForLlm } from "../llm.service.js";

vi.mock("../../config/env.js", () => ({
  env: {
    apiKey: "",
    model: "gpt-4o-mini",
    openAiBaseUrl: "https://api.openai.com/v1",
    port: 3002,
    httpsProxy: ""
  }
}));

import { resolveLlmFromEnv, callLLM } from "../llm.service.js";

const OPENAI_SNAPSHOT: OpenAiConfigForLlm = {
  apiKey: "sk-openai-test",
  model: "gpt-4o-mini",
  openAiBaseUrl: "https://api.openai.com/v1"
};

describe("resolveLlmFromEnv", () => {
  it("当 LLM_PROVIDER=openai 时始终走 OpenAI，即使配置了 DeepSeek 密钥", () => {
    const r = resolveLlmFromEnv(
      {
        LLM_PROVIDER: "openai",
        DEEPSEEK_API_KEY: "sk-ds-test"
      },
      OPENAI_SNAPSHOT
    );
    expect(r).toMatchObject({
      url: "https://api.openai.com/v1/chat/completions",
      key: "sk-openai-test",
      model: "gpt-4o-mini"
    });
  });

  it("当 LLM_PROVIDER=deepseek 时使用 DeepSeek 端点与密钥", () => {
    const r = resolveLlmFromEnv(
      {
        LLM_PROVIDER: "deepseek",
        DEEPSEEK_API_KEY: " sk-ds-1 "
      },
      OPENAI_SNAPSHOT
    );
    expect(r).toMatchObject({
      url: "https://api.deepseek.com/v1/chat/completions",
      key: "sk-ds-1",
      model: "deepseek-chat"
    });
  });

  it("未设置 LLM_PROVIDER 但存在 DEEPSEEK_API_KEY 时默认优先 DeepSeek", () => {
    const r = resolveLlmFromEnv(
      { DEEPSEEK_API_KEY: "sk-auto" },
      OPENAI_SNAPSHOT
    );
    expect(r.url).toBe("https://api.deepseek.com/v1/chat/completions");
    expect(r.key).toBe("sk-auto");
  });

  it("未设置 LLM_PROVIDER 且无 DeepSeek 密钥时退回 OpenAI", () => {
    const r = resolveLlmFromEnv({}, OPENAI_SNAPSHOT);
    expect(r.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(r.key).toBe("sk-openai-test");
  });

  it("respects DEEPSEEK_MODEL", () => {
    const r = resolveLlmFromEnv(
      {
        LLM_PROVIDER: "deepseek",
        DEEPSEEK_API_KEY: "sk-x",
        DEEPSEEK_MODEL: "deepseek-reasoner"
      },
      OPENAI_SNAPSHOT
    );
    expect(r.model).toBe("deepseek-reasoner");
  });

  it("OpenAI base URL 末尾斜杠会去重后再拼接 chat/completions", () => {
    const r = resolveLlmFromEnv(
      {},
      {
        ...OPENAI_SNAPSHOT,
        openAiBaseUrl: "https://proxy.example/v1///"
      }
    );
    expect(r.url).toBe("https://proxy.example/v1/chat/completions");
  });

  it("显式 deepseek 但缺少密钥时抛出明确错误", () => {
    expect(() =>
      resolveLlmFromEnv({ LLM_PROVIDER: "deepseek" }, OPENAI_SNAPSHOT)
    ).toThrow(/DEEPSEEK_API_KEY/);
  });

  it("走 OpenAI 但 apiKey 为空时抛出错误", () => {
    expect(() =>
      resolveLlmFromEnv(
        {},
        {
          apiKey: "",
          model: "gpt-4o-mini",
          openAiBaseUrl: "https://api.openai.com/v1"
        }
      )
    ).toThrow(/OPENAI_API_KEY/);
  });
});

describe("callLLM", () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = "sk-ds-integration";
    process.env.LLM_PROVIDER = "deepseek";
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.LLM_PROVIDER;
    vi.unstubAllGlobals();
  });

  it("成功响应时返回 choices[0].message.content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "模型回复" } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(callLLM("你好")).resolves.toBe("模型回复");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { body: string }
    ];
    expect(url).toBe("https://api.deepseek.com/v1/chat/completions");
    const body = JSON.parse(init.body) as {
      model: string;
      messages: { role: string; content: string }[];
    };
    expect(body.model).toBe("deepseek-chat");
    expect(body.messages[0].content).toBe("你好");
  });

  it("HTTP 非 2xx 时抛出带状态码与错误信息的 Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: { message: "Invalid API Key" } })
      })
    );

    await expect(callLLM("x")).rejects.toThrow(
      /LLM 请求失败 \(401\).*Invalid API Key/
    );
  });
});
