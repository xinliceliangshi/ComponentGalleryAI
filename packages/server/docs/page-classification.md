# 需求拆分与页面分类（v1.2 → Page Classification）

本文档描述 `packages/server` 中"需求拆分 + 页面分类"模块的设计、代码结构与调用链路。它是继 v1.2（OpenAI 直连 + 知识库召回）之后引入的一层 **规则式预处理**，目的是：

- 在调用 LLM 之前，先把用户的"一段话"理解成 **某种页型 + 一组子任务**；
- 用页型相关的约束 + 子任务关键词，**驱动知识库召回** 与 **提示词模板**；
- 解决一类典型问题：用户说"后台首页"，模型却生成了一张 CRUD 表格页。

> 代码位置：
> - 入口：`packages/server/src/services/requirement-decomposition.service.ts`
> - 类型：`packages/server/src/services/requirement-decomposition/types.ts`
> - Profile 注册表：`packages/server/src/services/requirement-decomposition/page-profiles/index.ts`
> - 具体 Profile：`packages/server/src/services/requirement-decomposition/page-profiles/*.ts`
> - 工具：`packages/server/src/services/requirement-decomposition/matchers.ts`
> - 上游消费：`generate.service.ts`、`component-knowledge.service.ts`、`prompt.service.ts`

---

## 1. 整体调用链

```
POST /api/generate { input }
  └─ generate.service.ts: generateService(input)
       1. decomposition  = decomposeRequirement(input)        ← 规则式拆分（本模块）
       2. knowledge      = formatKnowledgeContextForDecomposition(input, decomposition)
                            └─ buildDecompositionQueries(...) ← 多查询召回
       3. prompt         = buildPrompt(input, { decomposition, knowledge })
       4. raw            = callLLM(prompt)
       5. return GenerateSchema.parse(safeJsonParse(raw))
```

可以看到，**页面分类的产物 `decomposition` 同时进入了"召回"和"提示词"两条管道**，所以它是这一版改造的中枢数据结构。

---

## 2. 核心数据结构

`requirement-decomposition/types.ts`：

| 类型 | 关键字段 | 作用 |
|------|---------|------|
| `RequirementSubtaskPriority` | `"must" \| "should" \| "nice"` | 子任务优先级，决定 Prompt 里"必须覆盖 / 尽量体现"的语气 |
| `IntentRule` | `id / title / intent / priority / uiRegion / terms / dataNeeds / interactionNeeds / candidateKeywords` | **页面分类规则的最小单元**：`terms` 用于命中拆分，`candidateKeywords` 用于召回扩词 |
| `RequirementPageProfile` | `pageType / match(text) / rules / constraints` | 一个 **页型** = 命中函数 + 一组子任务规则 + 该页型的硬约束 |
| `RequirementSubtask` | 由 `IntentRule` 转换而来，剥掉 `terms`，对外暴露 | 喂给 Prompt 与召回 |
| `RequirementDecomposition` | `enabled / summary / pageType / userGoal / subtasks / constraints / risks` | 整个拆分结果 |

设计要点：

1. **`terms` ≠ `candidateKeywords`**：前者是"判定子任务是否被触发"的关键词，后者是"召回知识库时用的扩词"，可以更宽泛。
2. **`priority` 三档**：`must` 一定要在 LLM 输出里出现；`should` 尽量；`nice` 可有可无。Prompt 里直接复述了这条规则。
3. **`uiRegion`** 是给 LLM 的布局暗示（top/main/side/modal/bottom 等），不是强校验。

---

## 3. 页面分类（Page Profiles）

### 3.1 注册表与匹配顺序

`page-profiles/index.ts` 维护一个 **有顺序** 的数组：

```ts
export const requirementPageProfiles: RequirementPageProfile[] = [
  adminHomeDashboardProfile, // ① 后台首页 / 工作台
  adminManagementProfile,    // ② 后台管理列表
  dashboardProfile,          // ③ 看板/仪表盘
  formPageProfile,           // ④ 表单页
  detailPageProfile          // ⑤ 详情页
];

export function matchRequirementPageProfile(text: string): RequirementPageProfile {
  return requirementPageProfiles.find((p) => p.match(text)) ?? fallbackRequirementProfile;
}
```

> **顺序很关键**：把 `adminHomeDashboardProfile` 放在 `adminManagementProfile` 之前，是为了避免"做一个后台管理首页"被先归到普通管理页（命中"后台/管理"）从而被生成成 CRUD 表格页。

### 3.2 已注册的 Profile 一览

| pageType | 命中条件（`match`） | rules 来源 | 备注 |
|----------|--------------------|-----------|------|
| `admin-home-dashboard` | **必须同时** 命中 ①家族（首页/工作台/控制台/仪表盘/看板/概览/总览/dashboard）和 ②家族（后台/管理系统/运营/数据/统计/管理） | 自有 5 条 | 首页专用，强制启用拆分 |
| `admin-management` | 命中 后台 / 管理 / 列表 / 表格 任意一个 | 自有 9 条 | 通用 CRUD 后台 |
| `dashboard` | 看板 / 仪表盘 / 统计 / 图表 | **复用** `admin-management` | 占位，后续可独立 |
| `form-page` | 表单 / 填写 / 提交 / 申请 | **复用** `admin-management` | 占位 |
| `detail-page` | 详情 / 资料 / 信息 | **复用** `admin-management` | 占位 |
| `general-ui`（fallback） | 始终命中 | **复用** `admin-management` | 兜底 |

> 当前 `dashboard / form-page / detail-page / general-ui` 共享 `adminManagementProfile.rules` 是 **临时方案**：用相同的规则集，但 `pageType` 标签不同，方便后续替换为各自专属规则而不用动调用方。

### 3.3 `adminManagementProfile`（通用后台）规则

定义在 `page-profiles/admin-management.ts`，9 个子任务规则（节选 `id` 与 `priority`）：

| id | title | priority | uiRegion | 触发示例词 |
|----|-------|----------|----------|-----------|
| `filter` | 筛选查询区 | must | top | 筛选/过滤/搜索/查询/检索/条件 |
| `table` | 数据表格 | must | main | 表格/列表/数据表/明细 |
| `pagination` | 分页控制 | must | bottom | 分页/翻页/页码/每页 |
| `batch-actions` | 批量操作 | should | table-toolbar | 批量/多选/勾选 |
| `detail-drawer` | 详情抽屉 | should | side-panel | 抽屉/侧边/侧滑/详情 |
| `edit-dialog` | 编辑弹窗 | should | modal | 弹窗/对话框/新增/编辑/表单 |
| `upload` | 文件上传 | should | — | 上传/附件/文件/导入 |
| `charts` | 图表展示 | should | main | 图表/趋势/统计/看板/可视化 |
| `status-permission` | 状态与权限呈现 | should | — | 状态/权限/角色/启用/禁用/审核 |

`constraints`：
- 必须覆盖所有 `must` 子任务；
- `should` 子任务尽量在页面中体现；
- 涉及表格/列表/数据表格时，**优先使用 `ZhTable / ZhDiyDataTable`**（与组件知识库联动）。

### 3.4 `adminHomeDashboardProfile`（后台首页 / 工作台）规则

定义在 `page-profiles/admin-home-dashboard.ts`：

| id | title | priority | uiRegion |
|----|-------|----------|----------|
| `kpi-overview` | 核心指标概览 | must | top |
| `trend-chart` | 趋势图表 | must | main |
| `todo-list` | 待办事项 | should | side |
| `quick-actions` | 快捷入口 | should | middle |
| `recent-activity` | 最近动态 | nice | bottom |

`constraints` 中除了 must/should 的通用约束外，新增两条 **首页专属硬约束**：
- 后台首页必须体现核心指标、趋势/统计、待办或快捷入口；
- **不要把首页生成成单一 CRUD 表格页；表格只能作为辅助模块，不能成为页面主体。**

这两条会被 `prompt.service.ts` 翻成更显眼的指令灌进 system 区域（见 §5）。

---

## 4. 拆分流程：`decomposeRequirement`

源码：`requirement-decomposition.service.ts`。

```ts
export function decomposeRequirement(input: string): RequirementDecomposition {
  const text          = normalizeInput(input);                 // 折叠空白
  const profile       = matchRequirementPageProfile(text);     // 选 Profile
  const matchedRules  = profile.rules.filter(r => includesAny(text, r.terms));
  const enabled       =
        profile.pageType === "admin-home-dashboard"            // 首页强制启用
     || shouldEnableDecomposition(text, matchedRules.length);  // 否则启发式

  const subtasks = matchedRules.map(toSubtask);

  // 启用了拆分但一条规则也没命中 → 兜底"主要界面"，避免空 subtasks
  if (enabled && subtasks.length === 0) {
    subtasks.push({
      id: "main-ui", title: "主要界面", intent: "general-ui",
      priority: "must", dataNeeds: [], interactionNeeds: [],
      candidateKeywords: [text]
    });
  }

  return {
    enabled,
    summary: buildSummary(text),                      // 截断到 60 字符
    pageType: profile.pageType,
    userGoal: text,
    subtasks,
    constraints: enabled ? profile.constraints : [],
    risks: enabled ? ["原始需求较大，直接生成容易遗漏局部模块或交互"] : []
  };
}
```

### 4.1 是否启用拆分（`enabled`）

`shouldEnableDecomposition` 的判定条件（满足任一即启用）：

- 文本长度 > 80；
- 命中复杂连接词 ≥ 2（"包含/支持/同时/以及/并且/需要/还要/包括/实现/带有/具备"）；
- 命中规则数 ≥ 3。

此外，**`pageType === "admin-home-dashboard"` 直接绕过这套阈值**——因为首页生成在没有拆分时极易翻车。

短小单意图（例如 `做一个登录按钮`）则保持 `enabled=false`，`subtasks=[]`，回退到旧的"原文 → 召回 → Prompt"流。

### 4.2 召回查询拼装：`buildDecompositionQueries`

```ts
export function buildDecompositionQueries(input, decomposition): string[] {
  if (!decomposition.enabled) return [input];

  const queries = [
    input,                                          // 原文
    decomposition.summary,                          // 摘要
    ...decomposition.subtasks.map((task) =>        // 每个子任务一条
      [task.title, task.intent, ...task.candidateKeywords].filter(Boolean).join(" ")
    )
  ];
  return Array.from(new Set(queries.map(q => q.trim()).filter(Boolean)));
}
```

下游 `component-knowledge.service.ts → retrieveKnowledgeForDecomposition` 会把这些查询逐条送入打分器，再用 `Map` 去重合并卡片与代码片段。这意味着 **Profile 中 `candidateKeywords` 直接影响召回多样性与命中率**。

---

## 5. 与提示词模板的对接

`prompt.service.ts` 中 `formatRequirementDecomposition` 把 `decomposition` 序列化进 prompt，关键点：

1. 仅在 `enabled` 时注入"【需求拆分（规则预处理）】"段；
2. 把 `summary / pageType / userGoal / subtasks / constraints / risks` 打成 JSON 灌进上下文；
3. 当 `pageType === "admin-home-dashboard"` 时，额外插入一段 **首页专项要求**：

   ```
   后台首页专项要求：
   - 首屏必须体现核心指标、趋势/统计、待办或快捷入口
   - 不要把首页生成成单一 CRUD 表格页
   - 表格只能作为辅助模块，不能成为页面主体
   - 布局应适合后台首页：顶部指标区 + 主内容统计区 + 侧边待办/消息区
   ```

4. 末尾补一句硬性指令：

   > 必须覆盖所有 priority=must 的子任务；priority=should 的子任务尽量体现；不要只实现第一个子任务。

这样，**Profile 的 `constraints` + pageType 特判 + subtask 列表** 就把"页面分类"的领域知识从 LLM 的"自由发挥"中拉回到一个可控范围。

---

## 6. 端到端示例

### 示例 A：短需求，不启用拆分

输入：`做一个登录按钮`

- `matchRequirementPageProfile` → `general-ui`（fallback，因为没命中前面任何 Profile 的 `match`）
- `matchedRules` 数量很少，`shouldEnableDecomposition` 返回 false
- `enabled=false`，`subtasks=[]`
- 召回走旧路径 `formatKnowledgeContext(input)`，Prompt 不注入"需求拆分"段。

### 示例 B：后台 CRUD 大需求

输入：`做一个后台用户管理页面，包含筛选、表格、批量操作、详情抽屉、编辑弹窗、权限状态和分页`

- 命中 `adminManagementProfile`（"后台/管理/列表"）
- 命中规则：`filter / table / batch-actions / detail-drawer / edit-dialog / status-permission / pagination`（≥ 3 条）→ `enabled=true`
- 召回查询包括"数据表格""详情抽屉"等，会更稳地命中 `ZhTable / ZhDiyDataTable` 知识。

### 示例 C：后台首页（本版重点）

输入：`做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口`

- `adminHomeDashboardProfile.match`：同时命中"首页"+"后台/管理" → 命中
- 因为 `pageType === "admin-home-dashboard"` → 强制 `enabled=true`
- `subtasks` 包含 `kpi-overview / trend-chart / todo-list / quick-actions`，**不包含 `table`**
- Prompt 中追加首页专项约束，避免 LLM 退化成 CRUD 表格页

这三个例子在 `services/__tests__/requirement-decomposition.service.test.ts` 都有对应单测，新增/修改 Profile 时请同步覆盖。

---

## 7. 扩展指南

### 7.1 新增一个页型 Profile

1. 在 `requirement-decomposition/page-profiles/` 下新增文件，例如 `chart-explorer.ts`，导出一个 `RequirementPageProfile`：

   ```ts
   import { includesAny } from "../matchers.js";
   import type { RequirementPageProfile } from "../types.js";

   export const chartExplorerProfile: RequirementPageProfile = {
     pageType: "chart-explorer",
     match: (text) => includesAny(text, ["数据探索", "下钻", "可视化分析"]),
     rules: [
       /* ...IntentRule[] */
     ],
     constraints: ["主体应是图表 + 维度筛选，而不是表格"]
   };
   ```

2. 在 `page-profiles/index.ts` 把它注册进 `requirementPageProfiles`，**注意顺序**——更"专"的 Profile 放在更"泛"的之前。
3. 如果该页型需要绕过 `shouldEnableDecomposition` 的阈值（例如首页这种容易翻车的场景），在 `requirement-decomposition.service.ts` 的 `decomposeRequirement` 中加一个 `pageType === "..."` 分支。
4. 如果需要专属 Prompt 指令，在 `prompt.service.ts` 的 `formatRequirementDecomposition` 里追加 `pageType` 分支。
5. 在 `services/__tests__/requirement-decomposition.service.test.ts` 增加用例：覆盖 `pageType` 命中 + 关键 `subtasks` 出现 + 关键 `constraints` 注入。

### 7.2 给现有 Profile 新增一条 `IntentRule`

只需要在该 Profile 的 `rules` 数组里追加一项，注意：

- `terms` 用 **用户会真实写出的自然语言关键词**；
- `candidateKeywords` 用 **知识库里大概率出现的组件名 / 业务词**；
- 想被 LLM 必须实现就用 `must`，可选用 `should`，否则 `nice`；
- `uiRegion` 用统一的方位词（top/main/side/bottom/modal/...），保持横向一致。

### 7.3 替换占位 Profile（dashboard / form-page / detail-page）

目前这三个 Profile 的 `rules` 都直接复用了 `adminManagementProfile.rules`。当其中某个页型积累出独立的子任务集时，把它替换成自有的 `IntentRule[]` 与 `constraints` 即可，调用方无需改动。

---

## 8. 与其它模块的边界

| 模块 | 职责 | 与本模块的接口 |
|------|------|----------------|
| `component-knowledge.service.ts` | 组件知识库的打分召回 | 消费 `decomposition` → `buildDecompositionQueries` 多查询召回 |
| `prompt.service.ts` | LLM Prompt 拼装 | 消费 `decomposition` 注入"需求拆分"段 + pageType 专项指令 |
| `generate.service.ts` | 业务编排 | 调用 `decomposeRequirement`，把结果同时下发给召回与 Prompt |
| `llm.service.ts` | LLM HTTP 调用 | 与本模块无直接耦合 |
| `schemas/generate.schema.ts` | LLM 输出 Zod 校验 | 与本模块无直接耦合（注意：`tips` 字段尚未在 schema 中声明，见 `openai-direct-call.md` 末尾提示） |

---

## 9. 后续可能的演进方向

- **页型识别从规则升级到分类器**：当前 `match` 都是 `includesAny` 关键词集，足够覆盖常见后台需求；语义更复杂时可以替换成轻量分类器或调用一次小模型做 router。
- **子任务规则结构化**：`terms / candidateKeywords` 现在是字符串数组，可考虑加权重，与 `component-knowledge` 的 `weights.ts` 对齐。
- **Profile 与 RAG 知识包绑定**：每个 `pageType` 可以挂一份"推荐组件清单 / 反例清单"，进一步约束 LLM 输出。
- **风险（`risks`）流向 UI**：目前 `risks` 只是写进 Prompt，前端可以把它显式呈现给用户作为"生成前提示"。
