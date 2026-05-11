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
       2. knowledge      = retrieveKnowledgeForDecomposition(input, decomposition)
                            └─ buildDecompositionQueries(...) ← 多查询召回
       3. generationPlan = buildGenerationPlan(decomposition, knowledge)
       4. prompt         = buildPrompt(input, { decomposition, generationPlan, knowledge })
       5. raw            = callLLM(prompt)
       6. return GenerateSchema.parse(safeJsonParse(raw))
```

可以看到，**页面分类的产物 `decomposition` 先进入召回，再转成 `generationPlan`，最后进入 prompt**，所以它仍然是这一版改造的中枢数据结构，只是现在多了一层更稳定的生成规划。

---

## 2. 核心数据结构

`requirement-decomposition/types.ts`：

| 类型 | 关键字段 | 作用 |
|------|---------|------|
| `RequirementSubtaskPriority` | `"must" \| "should" \| "nice"` | 子任务优先级，决定 Prompt 里"必须覆盖 / 尽量体现"的语气 |
| `IntentRule` | `id / title / intent / priority / uiRegion / terms / dataNeeds / interactionNeeds / candidateKeywords` | **页面分类规则的最小单元**：`terms` 用于命中拆分，`candidateKeywords` 用于召回扩词 |
| `RequirementPageProfile` | `pageType / match(text) / rules / sections / constraints` | 一个 **页型** = 命中函数 + 一组子任务规则 + 可选结构模块 + 该页型的硬约束 |
| `RequirementSubtask` | 由 `IntentRule` 转换而来，剥掉 `terms`，对外暴露 | 喂给 Prompt 与召回 |
| `RequirementSection` | `kind / required / priority / layout / intent / uiRegion / sourceSubtaskId` | 最终输出的页面结构区块，供 Prompt 和召回复用 |
| `RequirementSectionBlueprint` | `kind / required / priority / layout / intent / uiRegion / sourceSubtaskIds / when` | Profile 内部使用的结构蓝图，由 `buildSections(...)` 裁剪成最终 sections |
| `RequirementDecomposition` | `enabled / summary / pageType / userGoal / subtasks / sections / constraints / risks` | 整个拆分结果 |
| `GenerationPlan` | `pageType / summary / userGoal / sections / globalConstraints / risks` | 面向代码生成器的施工图，串联结构区块与推荐组件 |

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
  adminDetailProfile,        // ② 后台详情页
  adminEditProfile,          // ③ 后台复杂编辑页
  adminCreateProfile,        // ④ 后台新增页 / 轻编辑
  adminManagementProfile,    // ⑤ 后台管理列表
  dashboardProfile,          // ⑥ 看板/仪表盘
  formPageProfile            // ⑦ 表单页
];

export function matchRequirementPageProfile(text: string): RequirementPageProfile {
  return requirementPageProfiles.find((p) => p.match(text)) ?? fallbackRequirementProfile;
}
```

> **顺序很关键**：越专的页型越要放在越前面。比如 `adminDetailProfile` 要早于 `adminManagementProfile`，避免"后台审核详情页"落成普通管理页；`adminEditProfile` 要早于 `adminCreateProfile`，让复杂编辑场景先被识别，再把轻编辑回落到新增页复用。

### 3.2 已注册的 Profile 一览

| pageType | 命中条件（`match`） | rules 来源 | 备注 |
|----------|--------------------|-----------|------|
| `admin-home-dashboard` | **必须同时** 命中 ①家族（首页/工作台/控制台/仪表盘/看板/概览/总览/dashboard）和 ②家族（后台/管理系统/运营/数据/统计/管理） | 自有 5 条 | 首页专用，强制启用拆分 |
| `admin-detail` | 命中详情语义，且包含状态 / 审核记录 / 基础信息等详情信号 | 自有 8 条 | 后台详情页，强制启用拆分 |
| `admin-edit` | 命中编辑意图（编辑/修改/维护/配置）并满足复杂信号分组阈值，且排除列表/详情主体 | 自有 9 条 | 复杂编辑页，强制启用拆分 |
| `admin-create` | 命中新增语义（新增/新建/创建/录入），或命中轻编辑但复杂度不足 | 自有 7 条 | 新增页，也承接轻编辑复用，强制启用拆分 |
| `admin-management` | 命中 后台 / 管理 / 列表 / 表格 任意一个 | 自有 9 条 | 通用 CRUD 后台 |
| `dashboard` | 看板 / 仪表盘 / 统计 / 图表 | **复用** `admin-management` | 占位，后续可独立 |
| `form-page` | 表单 / 填写 / 提交 / 申请 | **复用** `admin-management` | 占位 |
| `general-ui`（fallback） | 始终命中 | **复用** `admin-management` | 兜底 |

> 当前 `dashboard / form-page / general-ui` 共享 `adminManagementProfile.rules` 是 **临时方案**：用相同的规则集，但 `pageType` 标签不同，方便后续替换为各自专属规则而不用动调用方。

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

### 3.5 `adminCreateProfile`（后台新增页 / 轻编辑）规则

定义在 `page-profiles/admin-create.ts`，首版目标是稳定兜住 **新增录入** 和 **轻量编辑复用** 两类场景：

| id | title | priority | uiRegion |
|----|-------|----------|----------|
| `create-header` | 新增页头部 | must | header |
| `basic-form` | 主表单区 | must | main |
| `group-sections` | 分组卡片区 | should | main |
| `upload` | 上传附件 | should | main |
| `field-validation` | 字段校验与提示 | must | top |
| `draft-save` | 草稿保存 | should | footer |
| `submit-actions` | 提交操作区 | must | footer |

结构层（`sections`）进一步把它结构化为：
- `page-header`
- `form-body`
- `grouped-form`
- `upload-panel`
- `validation-summary`
- `action-footer`

核心约束：
- 页面主体必须是表单录入，不要生成成 CRUD 列表页或详情页；
- 不允许让表格成为新增页主体；
- 长表单应按分组卡片组织；
- 必须体现必填、校验、错误提示；
- 底部必须明确区分取消、保存/保存草稿、提交。

> `admin-create` 现在也承接 **轻编辑**：例如"后台编辑商品页面，包含基础信息、封面上传和保存按钮"。这类需求虽然带有“编辑”字样，但如果没有明显的状态/权限/历史/预览复杂度，仍按新增页骨架处理。

### 3.6 `adminEditProfile`（后台复杂编辑页）规则

定义在 `page-profiles/admin-edit.ts`。它不是“新增页回填数据”，而是单独解决 **状态驱动 / 权限驱动 / 历史驱动 / 预览驱动** 的复杂编辑场景。

页型识别采用“编辑意图 + 复杂信号分组计数”的方式：

- 编辑意图词：`编辑 / 修改 / 维护 / 配置 / 调整 / 更新`
- 复杂信号分组：
  - 状态：`状态 / 发布 / 下线 / 审核 / 流转 / 草稿 / 锁定`
  - 权限：`权限 / 角色 / 只读 / 禁用 / 可编辑`
  - 历史：`变更记录 / 操作日志 / 版本记录 / 差异 / 对比`
  - 结构：`预览 / 关联数据 / 子项 / 明细配置 / 局部保存 / 联动`

只有满足足够复杂度时才会命中 `admin-edit`；如果是列表主体或详情主体，会继续留在 `admin-management` / `admin-detail`。

规则层（`rules`）包括：

| id | title | priority | uiRegion |
|----|-------|----------|----------|
| `edit-header` | 编辑页头部 | must | header |
| `status-context` | 状态上下文 | must | top |
| `editable-form` | 可编辑表单区 | must | main |
| `grouped-sections` | 分组编辑区 | should | main |
| `relation-editor` | 关联数据编辑 | should | main |
| `preview-panel` | 预览区 | should | side |
| `validation-diff` | 校验与变更提示 | must | top |
| `history-panel` | 变更历史 | should | bottom |
| `edit-actions` | 编辑操作区 | must | footer |

结构层（`sections`）进一步表达推荐结构：
- `page-header`
- `status-banner`
- `form-body`
- `grouped-form`
- `relation-editor`
- `preview-panel`
- `validation-summary`
- `history-panel`
- `action-footer`

核心约束：
- 复杂编辑页不能等同于新增页回填，必须体现当前状态和编辑上下文；
- 页面主体允许表单、只读信息、关联配置、预览区混合布局；
- 必须体现字段可编辑、只读、禁用等不同状态；
- 必须体现校验、错误提示、变更提示等编辑反馈；
- 若涉及发布流或审核流，操作按钮必须根据状态和权限动态变化；
- 底部必须区分取消、保存、提交审核、发布等不同动作。

### 3.7 `admin-create` 与 `admin-edit` 的边界

这是本版最重要的新增规则之一，可以记成一句话：

> 后台表单页分为 `admin-create` 和 `admin-edit` 两类：前者解决录入型新增与轻编辑，后者解决状态/权限/历史/预览驱动的复杂编辑。

典型判定：

- `admin-create`
  - `做一个后台新增商品页面，包含基础信息、价格设置、封面上传和提交`
  - `做一个后台编辑商品页面，包含基础信息、封面上传和保存按钮`

- `admin-edit`
  - `做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览`
  - `做一个后台发布配置页面，包含草稿状态、发布流程、版本记录和实时预览`
  - `做一个后台角色权限维护页面，包含只读字段、权限分配、变更记录和保存发布`

---

## 4. 拆分流程：`decomposeRequirement`

源码：`requirement-decomposition.service.ts`。

```ts
export function decomposeRequirement(input: string): RequirementDecomposition {
  const text          = normalizeInput(input);                 // 折叠空白
  const profile       = matchRequirementPageProfile(text);     // 选 Profile
  const matchedRules  = profile.rules.filter(r => includesAny(text, r.terms));
  const enabled       =
        shouldAlwaysEnableDecomposition(profile.pageType)      // 指定页型强制启用
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

此外，`shouldAlwaysEnableDecomposition(pageType)` 会让以下页型直接绕过阈值判断：

- `admin-home-dashboard`
- `admin-detail`
- `admin-create`
- `admin-edit`

原因是这四类后台页面都已经有明确结构约束；一旦不启用拆分，生成结果很容易退化成普通 CRUD 或遗漏关键模块。

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
2. 把 `pageType / summary / subtasks / sections / constraints / risks` 组织成结构摘要灌进上下文；
3. 把 `GenerationPlan` 以“区块计划 + 推荐组件”的形式补进 prompt；
3. 当 `pageType` 命中专用分支时，额外插入对应的 **页型专项要求**。例如：

   `admin-home-dashboard`：

   ```
   后台首页专项要求：
   - 首屏必须体现核心指标、趋势/统计、待办或快捷入口
   - 不要把首页生成成单一 CRUD 表格页
   - 表格只能作为辅助模块，不能成为页面主体
   - 布局应适合后台首页：顶部指标区 + 主内容统计区 + 侧边待办/消息区
   ```

   `admin-edit`：

   ```
   后台复杂编辑页专项要求：
   - 复杂编辑页不能等同于新增页回填，必须体现当前状态和编辑上下文
   - 页面主体允许表单、只读信息、关联配置、预览区混合布局
   - 必须体现字段可编辑、只读、禁用等不同状态
   - 必须体现校验、错误提示、变更提示等编辑反馈
   - 若涉及发布流或审核流，操作按钮必须根据状态和权限动态变化
   - 底部必须区分取消、保存、提交审核、发布等不同动作
   ```

4. 末尾补一句硬性指令：

   > 必须覆盖所有 priority=must 的子任务；若存在 sections，必须优先按 required=true 的结构区块搭建页面骨架；priority=should 的子任务尽量体现；不要只实现第一个子任务。

这样，**Profile 的 `constraints` + pageType 特判 + subtask 列表 + section 骨架 + GenerationPlan** 就把"页面分类"的领域知识从 LLM 的"自由发挥"中拉回到一个可控范围。

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

### 示例 D：复杂编辑页

输入：`做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览`

- 命中 `adminEditProfile`
- 复杂信号分组至少命中：状态 / 权限 / 历史 / 结构
- 因为 `admin-edit` 属于强制启用拆分页型，所以 `enabled=true`
- `subtasks` 会包含 `edit-header / status-context / editable-form / preview-panel / validation-diff / history-panel`
- `sections` 会注入 `page-header / status-banner / preview-panel / history-panel / action-footer`
- Prompt 中追加复杂编辑页专项要求，约束模型不要退化成普通新增表单

这些例子在 `services/requirement-decomposition/__tests__/decompose-requirement.test.ts`、`services/requirement-decomposition/__tests__/build-decomposition-queries.test.ts` 与 `services/__tests__/prompt.service.test.ts` 都有对应单测，新增/修改 Profile 时请同步覆盖。

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

### 7.3 替换占位 Profile（dashboard / form-page）

目前这两个 Profile 的 `rules` 都直接复用了 `adminManagementProfile.rules`。当其中某个页型积累出独立的子任务集时，把它替换成自有的 `IntentRule[]` 与 `constraints` 即可，调用方无需改动。

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

---

## 10. 团队约定

这一节不是框架约束，而是为了让后续新增页型、补规则、补测试时保持口径一致。

### 10.1 示例输入怎么写

测试里的示例输入，建议统一遵循这个模板：

```txt
做一个[场景限定][页型名称]，包含[模块A]、[模块B]、[模块C]
```

例如：

- `做一个后台新增商品页面，包含基础信息、价格设置、封面上传和提交`
- `做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览`
- `做一个后台审核详情页，顶部展示标题、状态Tag和操作按钮，包含基础信息、审核记录和操作日志`
- `做一个后台用户管理页面，包含筛选、表格、批量操作和分页`

这样写有三个好处：

- 能稳定触发 `match` 中的页型识别词；
- 能稳定命中 `rules` 中的模块触发词；
- 对人类和 LLM 都足够自然，不会变成只服务测试的“假输入”。

### 10.2 示例输入要覆盖哪些信息

一条好的页型示例，最好同时覆盖三层信息：

1. `页型主语`
   例如：`后台新增商品页面`、`后台编辑活动页面`、`后台审核详情页`

2. `主体模块`
   例如：`基础信息`、`表格`、`审核记录`、`变更记录`、`预览`

3. `关键复杂度信号`
   例如：`状态流转`、`权限控制`、`只读字段`、`版本记录`

如果只有页型主语，没有模块和复杂度，测试价值会很弱；如果只有模块没有页型主语，又容易落到错误页型。

### 10.3 新增页型时至少补哪些测试

每新增一个独立 Profile，至少补这四类测试：

1. `pageType 命中测试`
   确认输入会命中正确页型，而不是被更泛的页型抢走。

2. `subtasks 测试`
   确认关键 `must` / `should` 子任务会被拆出来。

3. `sections 测试`
   如果该页型定义了 `sections`，确认返回的结构顺序、必选项、关键布局名正确。

4. `prompt 注入测试`
   确认该页型的专项要求会进入 `buildPrompt(...)`。

如果页型还接了特殊召回策略，再加一类：

5. `buildDecompositionQueries 测试`
   确认页型特有模块关键词会进入召回查询。

### 10.4 新增示例时要同时补“正例”和“反例”

不要只补“它应该命中谁”，还要补“它不应该命中谁”。

例如这次 `admin-edit` 的边界，就是靠这两组一起压住的：

- 正例：`做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览`
- 反例：`做一个后台编辑商品页面，包含基础信息、封面上传和保存按钮`

前者保证复杂编辑能识别出来，后者保证轻编辑不会被误伤。

### 10.5 新规则优先补在文档和测试，再补代码

后续如果再新增页型或调整边界，推荐顺序是：

1. 先在这份文档里写清“它解决什么问题、边界在哪”
2. 先写测试样例，明确正例和反例
3. 最后再改 `match / rules / sections / constraints`

这样做的好处是，大家讨论的对象先变成“规则说明 + 测试输入”，而不是一上来就在代码里猜边界。

### 10.6 当前页型的口径速记

- `admin-home-dashboard`
  指标、趋势、待办、快捷入口驱动的后台首页。

- `admin-detail`
  状态、基础信息、审核记录、日志驱动的后台详情页。

- `admin-create`
  新增录入页，也承接轻编辑复用。

- `admin-edit`
  状态/权限/历史/预览驱动的复杂编辑页。

- `admin-management`
  筛选、表格、分页、批量操作驱动的后台管理列表。

如果一个需求同时看起来像两个页型，优先问一句：

> 这个页面的主体是在“录入/修改”，还是在“查看/管理”？

这通常能帮我们快速判断它应该落到哪一类。
