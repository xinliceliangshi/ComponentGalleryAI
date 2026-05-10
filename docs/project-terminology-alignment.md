# 项目术语对齐表

这份文档不是为了扩展一个更大的 `schema`，而是先把整个项目里正在形成的几个核心概念对齐，避免后面不同模块各说各话。

## 1. 项目主链路

当前项目更适合先按下面这条链路统一语言：

`input -> requirement decomposition -> recall -> prompt assembly -> LLM structured output -> renderer`

对应到当前代码，大致是：

- `input`
  - 前端输入：`packages/web/src/composables/useGenerate.ts`
  - 接口入口：`packages/server/src/controllers/generate.controller.ts`
- `requirement decomposition`
  - 规则拆解：`packages/server/src/services/requirement-decomposition.service.ts`
- `recall`
  - 组件知识召回：`packages/server/src/services/component-knowledge.service.ts`
- `prompt assembly`
  - Prompt 组装：`packages/server/src/services/prompt.service.ts`
- `structured output`
  - LLM 输出校验：`packages/server/src/schemas/generate.schema.ts`
- `renderer`
  - 前端结果展示：`packages/web/src/components/ResultPanel.vue`

这条链路建议作为整个项目的第一层对齐骨架，后面的术语都挂在这上面。

## 2. 术语逐项对齐

| 术语 | 在本项目里建议的统一含义 | 当前对应位置 | 当前状态 | 后续对齐方向 |
| --- | --- | --- | --- | --- |
| `schema` | 机器可校验的数据边界，不负责承载所有业务概念 | `packages/server/src/schemas/generate.schema.ts` | 已存在，但只覆盖最终输出 | 后续补“请求 schema / 中间态 schema / 术语 schema”，不要把所有概念都塞进一个大输出 schema |
| `workflow` | 从输入到结果的处理流程 | `generate.service.ts` 串起拆解、召回、Prompt、LLM、解析 | 已存在，但还是隐式流程 | 后续把它显式命名成标准 pipeline，便于拆阶段观测 |
| `structured output` | LLM 必须返回的结构化 JSON 结果 | `buildPrompt()` 的 JSON 约束 + `GenerateSchema` | 已存在 | 后续可把 `tips`、`pageType`、`usedComponents` 等稳定成正式字段 |
| `state machine` | 前后端对“当前进行到哪一步”的状态约定 | 前端已有 `idle/loading/success/error` | 前端有轻量状态机，服务端没有 | 后续把服务端阶段态也补出来，如 `decomposed/recalled/prompted/generated/parsed` |
| `renderer` | 把结构化结果转成用户可见内容的那一层 | Web 的结果页组件，如 `ResultPanel.vue`、`CodeBlock.vue` | 已存在，但目前更像展示器 | 后续区分“结果展示 renderer”和“未来的页面生成 renderer” |
| `router` | 请求路由与流程分发入口 | `packages/server/src/routes/generate.route.ts` | 已存在，但很薄 | 后续若按任务类型分流，可扩成 `generate router / workflow router / page-type router` |
| `DSL` | 比自然语言更稳定、比完整代码更抽象的中间表达 | 当前基本没有正式 DSL | 尚未建立 | 后续如果要稳定生成，可在“需求拆解结果”与“最终代码”之间增加 page/module DSL |
| `config driven` | 行为由配置驱动，而不是写死在 if/else 中 | 页型 profile、模块 hints、知识库权重已带一点配置味道 | 半存在 | 后续把 page profile、query hints、prompt policy、render policy 继续配置化 |
| `component registry` | 可检索的组件知识注册表 | `component-knowledge/db.ts` + `types.ts` 的 `toolCards/chunks` | 已存在 | 建议统一命名为 registry，而不是一会儿叫 knowledge，一会儿叫 db |
| `recall` | 根据需求从 registry 中召回候选组件和片段 | `retrieveKnowledgeForQuery()` / `retrieveKnowledgeForDecomposition()` | 已存在，是当前核心能力之一 | 后续继续沿 `docs/top-n-retrieval-roadmap.md` 演进 |

## 3. 推荐的概念分层

为了避免后面继续混词，建议先分四层：

### A. 边界层

- `router`
- `schema`
- `structured output`

这一层回答的是：请求怎么进来，结果怎么出去，数据边界是什么。

### B. 编排层

- `workflow`
- `state machine`

这一层回答的是：系统当前在哪个阶段，阶段之间怎么推进。

### C. 知识层

- `component registry`
- `recall`
- `config driven`

这一层回答的是：系统依据什么知识做判断，如何不用改代码就能调策略。

### D. 表达层

- `DSL`
- `renderer`

这一层回答的是：中间表达是什么，最后怎么落成可见结果或可运行代码。

## 4. 对当前项目最重要的几个“逐步对上点”

这里不是让每个词马上落代码，而是先明确接下来整理时优先对齐什么。

### 4.1 先把 `workflow` 说清楚

建议把项目主流程固定成下面 6 步：

1. `input`
2. `decomposition`
3. `recall`
4. `prompt build`
5. `structured generation`
6. `render/display`

这样以后讨论“问题出在哪”时，能直接说是 workflow 的哪一段出了偏差。

### 4.2 把 `component registry` 和 `recall` 绑定为一组词

现在代码里更多叫 `knowledge`，但从项目协作语言上，建议逐步统一为：

- `registry` = 存量组件知识
- `recall` = 从 registry 中召回

也就是：

- 不再泛说“知识库命中了没有”
- 更明确地说“registry 是否完整”“recall 是否准确”

### 4.3 把 `schema` 和 `DSL` 明确区分

这是最容易混的地方：

- `schema` 是校验边界
- `DSL` 是表达能力

比如当前 `GenerateSchema` 只是输出校验，它不是页面表达 DSL。

如果未来要支持更稳定的页面生成，中间可能需要的是：

- 页面级 DSL：页面类型、布局区块、模块树
- 组件级 DSL：组件名、props、交互、数据绑定

而不是继续把所有东西硬塞进最终 JSON 输出。

### 4.4 把 `state machine` 从前端状态扩到服务端阶段态

现在前端已有：

- `idle`
- `loading`
- `success`
- `error`

后面如果要做可观测性、调试和中途展示，建议服务端也逐步引入阶段态：

- `received`
- `decomposed`
- `recalled`
- `prompted`
- `generated`
- `validated`

这样 `workflow` 才不只是代码调用顺序，而是能被观察的状态流。

### 4.5 把 `config driven` 收口到三个配置面

目前“配置驱动”的苗头分散在各处，后续可以只盯三个面整理：

1. `page profile config`
   - 页型识别、模块定义、约束
2. `recall config`
   - synonym、weight、dedupe、intent boost
3. `prompt policy config`
   - 不同页型和任务的 Prompt 规则

这样不会一上来就泛化成“整个项目都配置化”。

## 5. 一个更适合当前阶段的总 schema

这里的 `schema` 不是指 JSON schema，而是“项目认知框架”：

| 层级 | 核心对象 | 关键术语 |
| --- | --- | --- |
| 输入层 | user input / request | `router`, `schema` |
| 编排层 | task pipeline | `workflow`, `state machine` |
| 知识层 | component knowledge | `component registry`, `recall`, `config driven` |
| 表达层 | intermediate + output | `DSL`, `structured output`, `renderer` |

如果后面继续逐步整理，建议所有新增模块、文档、命名，优先回答两个问题：

1. 它属于这四层里的哪一层？
2. 它是在补 `schema`、`workflow`、`registry`、`DSL` 里的哪一个空位？

## 6. 当前一句话结论

这个项目现在最适合被理解成：

一个以 `workflow` 为骨架、以 `component registry + recall` 为知识核心、以 `structured output` 为当前交付边界、未来可能向 `DSL + renderer` 演进的生成系统。
