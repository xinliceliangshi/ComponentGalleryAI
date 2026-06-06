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

## Python Structured Output

仓库现在额外提供了一个独立的 Python 学习模块，用来演示如何把当前生成链路抽成 `Pydantic Schema`：

- 目录：[`packages/python-structured-output`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output)
- 覆盖对象：`RequirementDecomposition`、`GenerationPlan`、`GenerateResult`

可用命令：

```bash
pnpm python:structured:demo
pnpm python:structured:schema
```

首次使用前，请先按 [`packages/python-structured-output/README.md`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/README.md) 安装 Python 依赖。

## Page Type Quick Reference

服务端在 `packages/server/src/services/requirement-decomposition/` 里会先做一层“页型识别 + 子任务拆分”，再把结果送进知识库召回和 Prompt 生成。

当前后台页型口径可以先记成这 5 类：

- `admin-home-dashboard`: 指标、趋势、待办、快捷入口驱动的后台首页。
- `admin-detail`: 状态、基础信息、审核记录、日志驱动的后台详情页。
- `admin-create`: 新增录入页，也承接轻编辑复用。
- `admin-edit`: 状态/权限/历史/预览驱动的复杂编辑页。
- `admin-management`: 筛选、表格、分页、批量操作驱动的后台管理列表。

快速判断时，可以先问一句：

> 这个页面的主体是在“录入/修改”，还是在“查看/管理”？

更完整的规则说明见 [packages/server/docs/page-classification.md](/Users/wangying/Desktop/ComponentGalleryAI/packages/server/docs/page-classification.md)。

## Server Docs

- [OpenAI 调用说明](/Users/wangying/Desktop/ComponentGalleryAI/packages/server/docs/openai-direct-call.md)
- [LangChain 最小接入方案](/Users/wangying/Desktop/ComponentGalleryAI/packages/server/docs/langchain-minimal-integration.md)
