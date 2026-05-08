# OpenAI 调用说明（本项目直连方式）

本文记录 **服务端如何调用 LLM**：使用 Node 内置风格请求（`undici.fetch`）直接向 **OpenAI Chat Completions** 发 HTTP 请求，**不依赖** OpenAI 官方 npm SDK，也不依赖国内聚合平台的控制台/SDK；密钥与地址仅通过环境变量配置。

## 调用链

1. `POST /api/generate`，请求体 `{ "input": string }`  
2. `controllers/generate.controller.ts` → `services/generate.service.ts`  
3. `buildPrompt(input)`（`prompt.service.ts`）拼用户提示  
4. `callLLM(prompt)`（`llm.service.ts`）→ HTTP POST  
5. 响应正文解析为 JSON，经 `GenerateSchema` 校验后返回

## HTTP 请求规格（与官方 Chat Completions 对齐）

| 项目 | 说明 |
|------|------|
| **方法** | `POST` |
| **URL** | `{OPENAI_BASE_URL}/chat/completions`  
| **默认 Base URL** | `https://api.openai.com/v1`（末尾无 `/`；代码里会去掉尾随 `/` 再拼接） |
| **请求头** | `Authorization: Bearer {OPENAI_API_KEY}`、`Content-Type: application/json` |
| **请求体** | JSON：`model`、`temperature: 0.2`、`messages: [{ role: "user", content: prompt }]` |

等价 curl 示例（请替换密钥与模型）：

```bash
curl -sS https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "temperature": 0.2,
    "messages": [{ "role": "user", "content": "你好" }]
  }'
```

成功时从响应中取：**`choices[0].message.content`**（字符串）；HTTP 非 2xx 时用响应 JSON 里的 **`error.message`** 拼错误信息抛出。

## 环境变量（`config/env.ts`）

| 变量 | 作用 | 默认 / 备注 |
|------|------|-------------|
| `OPENAI_API_KEY` | Bearer Token | 必填，否则 `callLLM` 抛错 |
| `OPENAI_MODEL` | `body.model` | 默认 `gpt-4o-mini` |
| `OPENAI_BASE_URL` | API 根路径（须兼容上述路径与鉴权方式） | 默认 `https://api.openai.com/v1` |
| `HTTPS_PROXY` 或 `HTTP_PROXY` | 请求走代理 | 可选；使用 `undici` 的 `ProxyAgent` |

`.env` 加载顺序：先 `packages/server/.env`，再 `packages/server/src/.env`（后者覆盖前者）。

## 代理与自建兼容接口

- **官方域名不可达**：可设置本机代理环境变量（如 Clash 本地端口），不必经过第三方「平台」控制台。  
- **自建或其它兼容 OpenAI 格式的网关**：将 `OPENAI_BASE_URL` 设为对方的 **`.../v1` 根**，路径仍为 `/chat/completions`，请求体字段与官方一致即可。

## 业务侧约定

- Prompt 要求模型 **只返回 JSON**（含 `components`、`explanation`、`code`、`tips` 等字段），服务端对模型输出做 `safeJsonParse` + Zod 校验（`GenerateSchema`）。  
- 若更换模型或 prompt，需同步验证模型是否稳定输出可解析 JSON。

## 代码入口

- 实际发起请求：`packages/server/src/services/llm.service.ts` 中的 `callLLM`  
- 配置聚合：`packages/server/src/config/env.ts`

## 完整源码快照

路径相对于 `packages/server/`（`src/` 内为运行时源码）。与仓库同步维护时可对照提交更新本节。

### `src/index.ts`

```typescript
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
```

### `src/app.ts`

```typescript
import express from "express";
import cors from "cors";
import generateRoute from "./routes/generate.route.js";
import healthRoute from "./routes/health.route.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/generate", generateRoute);
  app.use("/api/health", healthRoute);

  return app;
}
```

### `src/config/env.ts`

```typescript
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
  ).trim()
};
```

### `src/services/llm.service.ts`

```typescript
import { fetch, ProxyAgent } from "undici";
import { env } from "../config/env.js";

export async function callLLM(prompt: string) {
  if (!env.apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const url = `${env.openAiBaseUrl}/chat/completions`;
  const dispatcher = env.httpsProxy ? new ProxyAgent(env.httpsProxy) : undefined;

  const res = await fetch(url, {
    method: "POST",
    dispatcher,
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(`OpenAI API error: ${msg}`);
  }

  return data.choices?.[0]?.message?.content ?? "";
}
```

### `src/services/prompt.service.ts`

```typescript
export function buildPrompt(input: string) {
    return `
  你是一个资深前端工程师，擅长 Vue / React 和组件库。
  
  请返回 JSON：
  
  {
    "components": [
      { "name": "", "usage": "" }
    ],
    "explanation": "",
    "code": "",
    "tips": ""
  }
  
  要求：
  - 只返回 JSON
  - code 必须完整
  - 不要 markdown
  
  用户需求：
  ${input}
  `.trim();
  }
```

### `src/services/generate.service.ts`

```typescript
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
```

### `src/utils/safe-json.ts`

```typescript
export function safeJsonParse(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON");
      return JSON.parse(match[0]);
    }
  }
```

### `src/schemas/generate.schema.ts`

```typescript
import { z } from "zod";

export const GenerateSchema = z.object({
    components: z.array(
        z.object({
            name: z.string(),
            usage: z.string()
        })
    ),
    explanation: z.string(),
    code: z.string()
}).strict();
```

### `src/controllers/generate.controller.ts`

```typescript
import type { Request, Response } from "express";
import { generateService } from "../services/generate.service.js";

export async function generateController(req: Request, res: Response) {
  try {
    const { input } = req.body as { input?: string };

    if (!input) {
      return res.status(400).json({ error: "input required" });
    }

    const result = await generateService(input);

    res.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({
      error: "GENERATE_FAILED",
      message
    });
  }
}
```

### `src/routes/generate.route.ts`

```typescript
import { Router } from "express";
import { generateController } from "../controllers/generate.controller.js";

const router = Router();

router.post("/", generateController);

export default router;
```

> **提示**：`prompt.service.ts` 示例 JSON 中含 `tips`，但 `GenerateSchema` 为 `.strict()` 且未声明 `tips` 时，模型若返回该字段会导致校验失败；需要 `tips` 时请同步扩展 `GenerateSchema`。
