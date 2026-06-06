# LangChain 最小接入方案

本文记录这个项目当前最适合的 **LangChain 最小接入方式**：先把 LangChain 作为 **LLM 调用适配层** 引入，而不是一上来重写整条生成链路或把向量检索全面替换掉。

适用目标：

- 想保留现有 `requirement decomposition -> recall -> prompt assembly -> structured output` 主链路
- 想先验证 LangChain 调用模型是否稳定
- 想避免刚接入就被向量库、Embeddings、代理兼容性问题拖住

## 1. 当前主链路

项目现在的主流程是：

`input -> requirement decomposition -> recall -> prompt assembly -> LLM structured output -> renderer`

后端关键位置：

- 请求入口：`src/controllers/generate.controller.ts`
- 总编排：`src/services/generate.service.ts`
- 召回：`src/services/component-knowledge.service.ts`
- Prompt 拼装：`src/services/prompt.service.ts`
- LangChain LLM 适配层：`src/services/langchain.service.ts`
- 输出校验：`src/schemas/generate.schema.ts`

当前 `generate.service.ts` 的关键逻辑是：

1. `decomposeRequirement(input)`
2. `retrieveKnowledge...`
3. `buildGenerationPlan(...)`
4. `buildPrompt(...)`
5. `callLangChain(prompt)`
6. `safeJsonParse + GenerateSchema.parse`

所以，**LangChain 最合适的第一落点** 不是前端，也不是 `prompt.service.ts`，而是：

- 优先替换 `callLLM(prompt)` 这一层
- 暂时不改规则拆分、知识召回、Prompt 组织方式

## 2. 为什么先只接 LLM 层

这样做的好处：

- 改动最小，只影响模型调用边界
- 保留项目当前已经比较稳定的页型拆解和知识召回
- 方便对比“原生 fetch 调用”和“LangChain 调用”的效果差异
- 出问题时更容易定位，不会和 Embeddings / Chroma / 代理兼容性问题混在一起

不建议第一阶段就做的事情：

- 用 LangChain 全量重写 `generate.service.ts`
- 用在线网页抓取替代现有组件知识库
- 一上来接入 `Chroma + OpenAIEmbeddings`
- 同时引入会话记忆、Agent、Tool calling

## 3. 当前仓库中的最小骨架

本仓库已经补了两个实验性文件：

- `src/services/langchain.service.ts`
- `src/services/vectorstore.service.ts`

职责分别是：

### `langchain.service.ts`

负责最小模型调用适配：

- 动态加载 `@langchain/openai`
- 创建 `ChatOpenAI`
- 调用 `invoke(prompt)`
- 返回字符串结果，继续复用现有 `safeJsonParse` 和 `GenerateSchema`

这个文件适合第一阶段直接接入主流程。

### `vectorstore.service.ts`

负责最小向量检索骨架：

- 动态加载 `@langchain/openai`
- 动态加载 `@langchain/community/vectorstores/chroma`
- 动态加载 `langchain/text_splitter`
- 将文本数组切分后写入 Chroma
- 暴露 retriever

这个文件是为第二阶段准备的，**第一阶段不建议立刻启用**。

## 4. 推荐接入顺序

### 阶段 1：只替换模型调用

把：

```ts
const raw = await callLLM(prompt);
```

替换成：

```ts
import { callLangChain } from "./langchain.service.js";

const raw = await callLangChain(prompt);
```

这样主流程仍然是：

`decompose -> recall -> prompt -> langchain invoke -> safeJsonParse -> zod parse`

这一步现在已经完成，当前主链路默认走 `callLangChain()`。

### 阶段 2：为知识召回增加可选向量检索

不要直接删除现有 `component-knowledge.service.ts` 的规则召回。

更稳妥的做法是新增一条并行链路：

- 原有规则召回继续保留
- 新增 `retrieveKnowledgeByVector(query)`
- 最后 merge 两路召回结果

这样即使向量召回效果不稳定，也不会把现有主流程打穿。

当前仓库里这一阶段已经按“可选开启”接好了：

- `src/services/vectorstore.service.ts`：把本地组件知识转成 LangChain Memory Vector Store
- `src/services/component-knowledge.service.ts`：新增 hybrid 召回函数
- `src/services/generate.service.ts`：主链路已经切到 hybrid 版本

默认仍然是规则召回；只有配置开启后，才会尝试向量增强。

### 阶段 3：再考虑正式 chain 化

只有在阶段 1 和阶段 2 稳定后，才建议把这几段组装成更正式的 Runnable / Chain：

- PromptTemplate
- Retriever
- Model
- Output parser

否则很容易为了“用上 LangChain”而把调试复杂度抬高。

## 5. 依赖安装

如果只走最小模型调用，至少需要：

```bash
pnpm --filter server add @langchain/openai
```

如果要启用第二阶段的向量召回，再加：

```bash
pnpm --filter server add langchain
```

说明：

- `langchain.service.ts` 只依赖 `@langchain/openai`
- 当前 `vectorstore.service.ts` 使用的是 `MemoryVectorStore`
- 所以第二阶段最小依赖是 `@langchain/openai` + `langchain`
- 这版没有把 `Chroma` 作为主链路依赖，因此也不要求先装 `chromadb`

## 6. 环境变量建议

当前最小接入继续复用现有环境变量：

| 变量 | 作用 |
|------|------|
| `OPENAI_API_KEY` | 模型调用密钥 |
| `OPENAI_MODEL` | 模型名，默认 `gpt-4o-mini` |
| `OPENAI_BASE_URL` | OpenAI 兼容网关根地址 |

也就是说，LangChain 接入后，项目配置口径不需要立刻改变。

第二阶段额外增加了几项向量召回相关配置：

| 变量 | 作用 | 默认值 |
|------|------|--------|
| `COMPONENT_GALLERY_AI_VECTOR_RECALL` | 是否开启 LangChain 向量召回 | `false` |
| `COMPONENT_GALLERY_AI_RECALL_MODE` | `rule` / `hybrid` / `vector` | `rule` |
| `COMPONENT_GALLERY_AI_VECTOR_TOP_K` | 向量召回 topK | `6` |
| `OPENAI_EMBEDDING_MODEL` | embeddings 模型名 | `text-embedding-3-small` |

推荐先这样试：

```bash
COMPONENT_GALLERY_AI_VECTOR_RECALL=true
COMPONENT_GALLERY_AI_RECALL_MODE=hybrid
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

这套配置的含义是：

- 规则召回继续保留
- 向量召回作为补充结果 merge 进来
- 即使向量层失败，主流程仍优先回退到规则召回

如果你准备长期使用 OpenAI 兼容中转站，推荐把基础配置固定成：

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=你的中转站密钥
OPENAI_BASE_URL=https://你的网关/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

原因：

- `LLM_PROVIDER=openai` 可以避免项目因为本地还保留了 `DEEPSEEK_API_KEY` 而自动切到 DeepSeek
- `OPENAI_BASE_URL` 统一控制聊天模型和 embeddings 的 OpenAI 兼容入口
- `OPENAI_EMBEDDING_MODEL` 单独显式配置，方便排查“聊天可用但 embeddings 不可用”的情况

长期使用时，建议先保持：

```bash
COMPONENT_GALLERY_AI_VECTOR_RECALL=false
COMPONENT_GALLERY_AI_RECALL_MODE=rule
```

等确认中转站对 embeddings 也稳定后，再切到：

```bash
COMPONENT_GALLERY_AI_VECTOR_RECALL=true
COMPONENT_GALLERY_AI_RECALL_MODE=hybrid
```

## 7. 最小代码改法

推荐只改 `src/services/generate.service.ts` 一处。

示意：

当前代码就是这一路径：`buildPrompt(...) -> callLangChain(...) -> safeJsonParse(...) -> GenerateSchema.parse(...)`

注意：第一阶段不建议把 `safeJsonParse` 或 `GenerateSchema` 拿掉，因为它们正是当前结构化输出稳定性的关键保护层。

## 8. 关于 `API 上游不可用`

如果你在 LangChain 或 demo 中遇到 `API 上游不可用`，大概率不是 LangChain 框架本身的问题，而是：

1. `OPENAI_BASE_URL` 指向的中转服务不稳定
2. 代理服务支持聊天接口，但不稳定支持 embeddings
3. 向量库初始化时调用了 `/embeddings`，而上游并不兼容

这也是为什么当前推荐：

- 第一阶段只接 `ChatOpenAI`
- 暂时不要急着启用 `OpenAIEmbeddings`
- 先确认 `prompt -> model -> JSON` 这条链路稳定

## 9. 与你当前 demo 的关系

你给出的 demo 同时做了这几件事：

- `ChatOpenAI`
- `OpenAIEmbeddings`
- `RecursiveCharacterTextSplitter`
- `Chroma.from_documents(...)`
- retriever + prompt chain

这套 demo 本身没有问题，但对本项目来说过于“一步到位”了。

本项目更适合拆成两步：

1. 先把 `ChatOpenAI.invoke()` 放进现有 `generate.service.ts`
2. 再考虑把现有组件知识源转成 `Document[]` 接入 Chroma

也就是说，demo 里的：

- `ChatOpenAI` 现在就适合接
- `OpenAIEmbeddings + Chroma` 暂时保留为第二阶段

## 10. 推荐结论

当前项目最稳妥的 LangChain 最小接入结论是：

1. LangChain 放在 `src/services/` 层，不放前端
2. 第一阶段先接 `langchain.service.ts`
3. `generate.service.ts` 现已从 `callLLM` 切到 `callLangChain`
4. 保留现有 `prompt.service.ts`、`component-knowledge.service.ts`、`GenerateSchema`
5. `vectorstore.service.ts` 作为后续实验入口，不要和第一阶段一起强行上线

一句话概括：

**先把 LangChain 当成 LLM 调用适配层，而不是业务主链路重写器。**

## 11. 稳定性验证方式

如果当前目标是先验证 “LangChain 调用模型是否稳定”，仓库里已经提供了一个最小冒烟脚本：

- `scripts/langchain-smoke.ts`

运行方式：

```bash
pnpm --filter server langchain:smoke
```

默认会连续调用 5 次。也可以自定义轮数：

```bash
LANGCHAIN_SMOKE_ROUNDS=10 pnpm --filter server langchain:smoke
```

脚本会输出：

- 每轮是否调用成功
- 每轮耗时
- JSON 是否可解析
- 是否通过 `GenerateSchema`
- 最终成功率和失败阶段统计

失败阶段分三类：

- `invoke`: 上游模型调用失败
- `json`: 模型输出不是可解析 JSON
- `schema`: JSON 能解析，但结构不符合当前输出约定

如果 `invoke` 经常失败，优先排查：

- `OPENAI_BASE_URL`
- API key
- 代理或上游兼容服务稳定性

如果 `json` 或 `schema` 经常失败，优先排查：

- Prompt 是否足够约束“只返回 JSON”
- 当前模型对结构化输出的稳定性
- 是否需要在 LangChain 层增加更强的结构化输出约束
