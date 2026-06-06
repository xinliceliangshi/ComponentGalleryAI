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
- 直连 LLM：`src/services/llm.service.ts`
- 输出校验：`src/schemas/generate.schema.ts`

当前 `generate.service.ts` 的关键逻辑是：

1. `decomposeRequirement(input)`
2. `retrieveKnowledge...`
3. `buildGenerationPlan(...)`
4. `buildPrompt(...)`
5. `callLLM(prompt)`
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

这是当前最推荐的最小接入方案。

### 阶段 2：为知识召回增加可选向量检索

不要直接删除现有 `component-knowledge.service.ts` 的规则召回。

更稳妥的做法是新增一条并行链路：

- 原有规则召回继续保留
- 新增 `retrieveKnowledgeByVector(query)`
- 最后 merge 两路召回结果

这样即使向量召回效果不稳定，也不会把现有主流程打穿。

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

如果要启用向量检索骨架，再加：

```bash
pnpm --filter server add @langchain/community langchain chromadb
```

说明：

- `langchain.service.ts` 只依赖 `@langchain/openai`
- `vectorstore.service.ts` 依赖 `@langchain/openai`、`@langchain/community`、`langchain`
- `chromadb` 是否需要额外安装，取决于实际使用的 Chroma 适配实现与运行环境；最小试验时建议一并装上

## 6. 环境变量建议

当前最小接入继续复用现有环境变量：

| 变量 | 作用 |
|------|------|
| `OPENAI_API_KEY` | 模型调用密钥 |
| `OPENAI_MODEL` | 模型名，默认 `gpt-4o-mini` |
| `OPENAI_BASE_URL` | OpenAI 兼容网关根地址 |

也就是说，LangChain 接入后，项目配置口径不需要立刻改变。

## 7. 最小代码改法

推荐只改 `src/services/generate.service.ts` 一处。

示意：

```ts
import { buildPrompt } from "./prompt.service.js";
import { callLangChain } from "./langchain.service.js";
import { safeJsonParse } from "../utils/safe-json.js";
import { GenerateSchema } from "../schemas/generate.schema.js";

export async function generateService(input: string) {
  // 省略 decomposition / knowledge / generationPlan
  const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge });
  const raw = await callLangChain(prompt);
  const parsed = safeJsonParse(raw);
  return GenerateSchema.parse(parsed);
}
```

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
2. 第一阶段只接 `langchain.service.ts`
3. `generate.service.ts` 只把 `callLLM` 换成 `callLangChain`
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
