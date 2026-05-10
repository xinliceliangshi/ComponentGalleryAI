import { formatKnowledgeContext, formatKnowledgeContextForDecomposition } from "./component-knowledge.service.js";
import type { RequirementDecomposition } from "./requirement-decomposition.service.js";

type BuildPromptOptions = {
  decomposition?: RequirementDecomposition;
  knowledge?: string;
};

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
      "- 操作按钮必须围绕 状态 → 按钮 → 权限 → 行为 组织",
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
    JSON.stringify(
      {
        summary: decomposition.summary,
        pageType: decomposition.pageType,
        userGoal: decomposition.userGoal,
        subtasks: decomposition.subtasks,
        modules: decomposition.modules,
        constraints: decomposition.constraints,
        risks: decomposition.risks
      },
      null,
      2
    ),
    pageTypeInstruction,
    "生成要求：必须覆盖所有 priority=must 的子任务；若存在 modules，必须优先按 modules 的 required=true 模块搭建页面结构；priority=should 的子任务尽量体现；不要只实现第一个子任务。"
  ].filter(Boolean).join("\n");
}

export function buildPrompt(input: string, options: BuildPromptOptions = {}) {
  const decomposition = options.decomposition;
  const knowledge =
    options.knowledge ??
    (decomposition?.enabled
      ? formatKnowledgeContextForDecomposition(input, decomposition)
      : formatKnowledgeContext(input));
  const decompositionContext = formatRequirementDecomposition(decomposition);

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

${decompositionContext ? `${decompositionContext}\n` : ""}
${knowledge ? `${knowledge}\n` : ""}用户需求：
${input}
`.trim();
}
