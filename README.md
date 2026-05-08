# ComponentGalleryAI

Modern AI Frontend Assistant (Web PC) — Vue 3 + Vite + TypeScript + UnoCSS.

## Quick Start

```bash
pnpm install
```

本地开发需同时起 **Express API（3002）** 与 **Vite 前端**。推荐一条命令：

```bash
pnpm dev:all
```

浏览器打开终端里提示的本地地址（默认 `http://localhost:5173`；若端口被占用会变成 5174、5175…）。

也可以开两个终端分别执行：

```bash
pnpm server:dev   # API → http://localhost:3002
pnpm dev          # 仅前端
```

在 `packages/server/src/.env` 中配置 `OPENAI_API_KEY` 或 DeepSeek 等（见同目录 `.env.example`）。

## Notes

- 前端通过 `POST /api/generate` 调用生成接口；开发环境下 Vite 将 `/api` **代理**到 `http://127.0.0.1:3002`。
- 未启动后端时，代理会返回 502 与 JSON 说明。
