import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { SYSTEM_PROMPT } from "./src/server/systemPrompt";

type GenerateRequest = { input: string };
type GenerateResponse = {
  components: Array<{ name: string; usage: string }>;
  explanation: string;
  code: string;
};

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body, null, 2);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(text);
}

function mockGenerate(input: string): GenerateResponse {
  const normalized = input.trim();
  const components = [
    { name: "Header", usage: "固定顶部，展示品牌与快捷入口（GitHub）。" },
    { name: "PromptInput", usage: "多行输入 + Enter 提交 + 示例提示，一次性触发生成。" },
    { name: "ResultPanel", usage: "承载组件推荐、解释与代码输出的核心区域。" },
    { name: "CodeBlock", usage: "VSCode 风格代码块：高亮、复制、折叠、横向滚动。" },
    { name: "LoadingState", usage: "Skeleton + 轻量动画，覆盖 generating 过程。" }
  ];

  const explanation =
    `实现思路（概览）：\n` +
    `1) 将用户需求解析为“页面区块 + 组件清单”。\n` +
    `2) 先输出组件推荐与用途，让实现路径更可控。\n` +
    `3) 最后生成可运行的 Vue 示例代码（Composition API），并保持结构化与可维护。\n\n` +
    `本次输入：${normalized ? `"${normalized}"` : "（空）"}\n` +
    `注意：当前为本地 mock（无真实大模型调用）。\n\n` +
    `System Prompt（将来用于接入 LLM）：\n${SYSTEM_PROMPT}`;

  const code = readFileSync(new URL("./src/server/mock-template.vue.txt", import.meta.url), "utf8")
    .replaceAll("__USER_NEED__", normalized || "（未填写需求）");

  return { components, explanation, code };
}

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS()
  ],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 5173
  },
  // Local API (dev only) for /api/generate
  // Keeps "pnpm run dev" one-command runnable.
  // In production, replace with real backend.
  // eslint-disable-next-line antfu/top-level-function
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/api/generate") return next();
      if (req.method !== "POST") return json(res, 405, { error: "Method Not Allowed" });

      try {
        const body = (await readJsonBody(req)) as Partial<GenerateRequest>;
        const input = typeof body.input === "string" ? body.input : "";
        if (!input.trim()) return json(res, 400, { error: "Missing input" });

        // Simulate latency to showcase skeleton/loading without stutter.
        await new Promise((r) => setTimeout(r, 700));
        return json(res, 200, mockGenerate(input));
      } catch (err) {
        return json(res, 500, { error: (err as Error).message || "Internal Error" });
      }
    });
  }
});
