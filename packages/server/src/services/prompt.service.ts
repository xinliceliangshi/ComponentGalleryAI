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
