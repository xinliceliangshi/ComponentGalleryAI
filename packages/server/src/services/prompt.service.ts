import { formatKnowledgeContext, formatKnowledgeContextForDecomposition } from "./component-knowledge.service.js";
import type { GenerationPlan } from "./generation-plan.service.js";
import type { RequirementDecomposition } from "./requirement-decomposition.service.js";

type BuildPromptOptions = {
  decomposition?: RequirementDecomposition;
  generationPlan?: GenerationPlan;
  knowledge?: string;
};

const WORKFLOW_STATE_LABELS: Record<string, string> = {
  draft: "草稿",
  pending: "待审核",
  processing: "处理中",
  approved: "已通过",
  rejected: "已拒绝"
};

function formatWorkflowState(state: string): string {
  return WORKFLOW_STATE_LABELS[state] ? `${WORKFLOW_STATE_LABELS[state]} (${state})` : state;
}

function formatSubtasks(decomposition: RequirementDecomposition): string {
  if (decomposition.subtasks.length === 0) return "无";

  return decomposition.subtasks
    .map((subtask) => `- [${subtask.priority}] ${subtask.title} (${subtask.intent})`)
    .join("\n");
}

function formatSections(decomposition: RequirementDecomposition): string {
  if (!decomposition.sections?.length) return "无";

  return decomposition.sections
    .map((section) => {
      const requiredLabel = section.required ? "required" : "optional";
      const layoutLabel = section.layout ? ` / ${section.layout}` : "";
      return `- [${requiredLabel}] ${section.kind}${layoutLabel}`;
    })
    .join("\n");
}

function formatWorkflow(decomposition: RequirementDecomposition): string {
  const workflow = decomposition.workflow;
  if (!workflow) return "";

  const transitionLines = workflow.transitions.map((transition) =>
    `  - ${formatWorkflowState(transition.from)} --${transition.action.key}/${transition.action.label ?? transition.action.key}--> ${formatWorkflowState(transition.to)}`
  );

  const actionLines = workflow.transitions.map((transition) => {
    const permissionText = transition.action.permissions?.length
      ? transition.action.permissions.join("、")
      : "无";
    const confirmText = transition.action.confirmText ?? "无";
    return `  - ${transition.action.key}: label=${transition.action.label ?? transition.action.key}, variant=${transition.action.variant ?? "default"}, permissions=${permissionText}, confirm=${confirmText}`;
  });

  return [
    "页面工作流（状态机模板，不构成独立区块）：",
    `- workflow.id：${workflow.id}`,
    `- 默认当前状态 workflow.initialState：${formatWorkflowState(workflow.initialState)}`,
    "- 允许的状态流转 workflow.transitions：",
    ...transitionLines,
    "- action 元信息（用于从 workflow 派生按钮区）：",
    ...actionLines
  ].join("\n");
}

function formatConstraints(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "无";
}

function formatGenerationPlan(plan: GenerationPlan | undefined): string {
  if (!plan) return "";

  const sectionLines = plan.sections.length > 0
    ? plan.sections.map((section) => {
      const componentText = section.recommendedComponents.length > 0
        ? section.recommendedComponents
          .map((component) => `${component.name}(${component.priority}): ${component.usage}`)
          .join("、")
        : "无";
      const snippetText = section.referenceSnippets.length > 0
        ? section.referenceSnippets
          .map((snippet) => {
            const label = [snippet.component, snippet.type, snippet.title].filter(Boolean).join(" / ");
            return `${label || "snippet"}: ${snippet.summary}`;
          })
          .join(" | ")
        : "无";
      return [
        `- ${section.title} [${section.kind}]${section.layout ? ` / ${section.layout}` : ""}`,
        `  goals: ${section.goals.join("；")}`,
        `  components: ${componentText}`,
        `  snippets: ${snippetText}`,
        ...(section.notes?.length ? [`  notes: ${section.notes.join("；")}`] : [])
      ].join("\n");
    }).join("\n")
    : "无";

  return [
    "【GenerationPlan】",
    `页面类型：${plan.pageType}`,
    `需求摘要：${plan.summary}`,
    "区块计划：",
    sectionLines,
    "全局约束：",
    formatConstraints(plan.globalConstraints),
    "风险提醒：",
    formatConstraints(plan.risks)
  ].join("\n");
}

function formatRequirementDecomposition(decomposition: RequirementDecomposition | undefined): string {
  if (!decomposition?.enabled) return "";

  const pageTypeInstructionMap: Record<string, string[]> = {
    "admin-home-dashboard": [
      "后台首页专项要求：",
      "- 首屏必须体现核心指标、趋势/统计、待办或快捷入口",
      "- 不要把首页生成成单一 CRUD 表格页",
      "- 表格只能作为辅助模块，不能成为页面主体",
      "- 布局应适合后台首页：顶部指标区 + 主内容统计区 + 侧边待办/消息区"
    ],
    "admin-detail": [
      "后台详情页专项要求：",
      "- Header 必须包含标题、状态 Tag、操作按钮区",
      "- 顶部必须体现状态驱动 UI，并根据不同状态显示不同文字",
      "- “待审核 / 已通过 / 已拒绝”等状态必须设计为可配置项，不要把状态枚举写死在模板分支里",
      "- 当前状态优先从 workflow.initialState 推理；若无 workflow.initialState，再回退到 status、nodeStatus 等业务字段",
      "- 状态文案、状态颜色、按钮可见性/禁用态必须从集中定义的状态配置或映射推导，例如 statusConfig、statusMap、deriveWorkflowActions(workflow, currentStatus, permissions)",
      "- 操作按钮必须围绕 状态 → 按钮 → 权限 → 行为 组织",
      "- 详情页先按 workflow 推理状态、权限、按钮和内容取舍，再映射到页面，不要把这些细粒度能力机械拆成独立 section",
      "- 生成代码时优先产出这类骨架：const currentStatus = detail.workflow?.current ?? detail.workflow?.initialState ?? detail.status；const actions = deriveWorkflowActions(workflow, { currentState: currentStatus, userPermissions })；再基于 currentStatus/actions 组织头部状态与操作区",
      "- 主体按卡片组织：基础信息、内容详情、审核记录、操作日志/时间线",
      "- 基础信息区优先使用 Descriptions + Grid",
      "- 审核记录表达业务行为历史，操作日志表达系统操作记录",
      "- 内容详情区可展示 markdown、html、图片、引用或 code block",
      "- 不要把详情页生成成列表页或 CRUD 表格页"
    ],
    "admin-create": [
      "后台新增页专项要求：",
      "- 页面主体必须是表单录入，不要生成成 CRUD 列表页或详情页",
      "- 不允许让表格成为新增页主体",
      "- 头部必须体现标题、返回和操作按钮区",
      "- 主体必须围绕表单字段组织，并体现必填、校验、错误提示",
      "- 长表单应拆成分组卡片，不要把所有字段平铺成一个块",
      "- 底部必须有明确的取消、保存/保存草稿、提交操作区"
    ],
    "admin-edit": [
      "后台复杂编辑页专项要求：",
      "- 复杂编辑页不能等同于新增页回填，必须体现当前状态和编辑上下文",
      "- 页面主体允许表单、只读信息、关联配置、预览区混合布局",
      "- 必须体现字段可编辑、只读、禁用等不同状态",
      "- 必须体现校验、错误提示、变更提示等编辑反馈",
      "- 若涉及发布流或审核流，操作按钮必须根据状态和权限动态变化",
      "- 底部必须区分取消、保存、提交审核、发布等不同动作"
    ]
  };
  const pageTypeInstruction = pageTypeInstructionMap[decomposition.pageType]?.join("\n") ?? "";

  return [
    "【需求拆分（规则预处理）】",
    `页面类型：${decomposition.pageType}`,
    `需求摘要：${decomposition.summary}`,
    "必须覆盖的子任务：",
    formatSubtasks(decomposition),
    "推荐页面骨架：",
    formatSections(decomposition),
    formatWorkflow(decomposition),
    "专项约束：",
    formatConstraints(decomposition.constraints),
    "风险提醒：",
    formatConstraints(decomposition.risks),
    pageTypeInstruction,
    "生成要求：必须覆盖所有 priority=must 的子任务；若存在 sections，必须优先按 sections 的 required=true 结构区块搭建页面骨架；若存在 workflow，必须按 workflow.initialState / workflow.transitions / transition.action 在所影响区块内推导状态、按钮、权限，不要把 workflow 拆成独立区块；priority=should 的子任务尽量体现；不要只实现第一个子任务。"
  ].filter(Boolean).join("\n");
}

export function buildPrompt(input: string, options: BuildPromptOptions = {}) {
  const decomposition = options.decomposition;
  const generationPlan = options.generationPlan;
  const knowledge =
    options.knowledge ??
    (decomposition?.enabled
      ? formatKnowledgeContextForDecomposition(input, decomposition)
      : formatKnowledgeContext(input));
  const decompositionContext = formatRequirementDecomposition(decomposition);
  const generationPlanContext = formatGenerationPlan(generationPlan);

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
- code 必须完整（可直接粘贴运行）
- 不要 markdown
- 优先参考“可用组件（自然语言概览）”来决定该用哪些组件
- 若引用组件库组件，优先使用知识库里出现的组件名与示例写法
- 若需求涉及“表格/列表/数据表格”，必须优先使用知识库中的 ZhTable / ZhDiyDataTable（若命中其示例/props），不要使用 Element Plus 的 el-table
- 若页面包含状态、权限、操作流转，必须从数据源或集中映射推导 UI；优先使用 workflow.current 或 workflow.initialState 推理当前状态，并通过 deriveWorkflowActions(workflow, { currentState, userPermissions }) 派生按钮；避免把状态文案、Tag 颜色、按钮集合硬编码在模板零散位置

${decompositionContext ? `${decompositionContext}\n` : ""}
${generationPlanContext ? `${generationPlanContext}\n` : ""}
${knowledge ? `${knowledge}\n` : ""}用户需求：
${input}
`.trim();
}
