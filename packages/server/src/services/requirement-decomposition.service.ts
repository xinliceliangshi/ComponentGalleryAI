import { includesAny } from "./requirement-decomposition/matchers.js";
import { matchRequirementPageProfile } from "./requirement-decomposition/page-profiles/index.js";
import type {
  IntentRule,
  RequirementDecomposition,
  RequirementModule,
  RequirementSubtask
} from "./requirement-decomposition/types.js";

export type {
  RequirementDecomposition,
  RequirementModule,
  RequirementSubtask,
  RequirementSubtaskPriority
} from "./requirement-decomposition/types.js";

const COMPLEX_CONNECTORS = ["包含", "支持", "同时", "以及", "并且", "需要", "还要", "包括", "实现", "带有", "具备"];

const MODULE_QUERY_HINTS: Record<string, string[]> = {
  createHeader: [
    "新增页头部 标题 返回 操作区 保存 提交",
    "新建页面 Header 标题栏 返回按钮 操作按钮"
  ],
  formSection: [
    "表单录入 输入框 选择器 日期 开关 表单布局",
    "后台新增表单 Form 字段 分组 校验"
  ],
  groupedCardSections: [
    "卡片表单 分组表单 Section 表单分区",
    "基础信息 配置规则 高级设置 分组卡片"
  ],
  uploadAttachments: [
    "上传附件 图片上传 文件上传 封面素材",
    "文件选择 上传列表 附件卡片"
  ],
  validationSummary: [
    "表单校验 必填提示 错误提示 校验规则",
    "提交前校验 错误汇总 未填写字段"
  ],
  submitBar: [
    "底部操作栏 提交按钮 保存草稿 取消",
    "吸底操作区 表单提交 固定底栏"
  ],
  detailHeader: [
    "详情页头部 返回 标题 状态 操作区 ZhDetailHeader",
    "详情头部 Header 标题栏 状态标签 操作按钮"
  ],
  statusSummary: [
    "状态副标题 状态条 状态文案 ZhDetailSubTitle",
    "状态驱动 UI 状态标签 待审核 已通过 已拒绝"
  ],
  statusActions: [
    "状态关联操作 权限按钮 按钮组 ZhButtonGroup ZhButton",
    "状态 按钮 权限 行为 通过 拒绝 撤回"
  ],
  baseInfo: [
    "基础信息 Descriptions Grid 信息卡片 字段展示 ZhBaseInfo ZhBaseItem ZhGrid",
    "详情信息 键值对 label value ZhInfoPair"
  ],
  contentDetail: [
    "内容详情 富文本 Markdown html 图片 引用 code block ZhBaseInfo ZhFileWrapper ZhToolTips",
    "富内容详情 图片预览 附件 视频播放器 ZhFileWrapper ZhVideoPlayer"
  ],
  auditRecords: [
    "审核记录 审批记录 业务历史 处理意见 ZhBaseInfo ZhDetailSubTitle",
    "审核人 审核时间 审核结果 审核意见 流转记录"
  ],
  operationLog: [
    "操作日志 操作记录 操作人 操作时间 操作内容 ZhBaseInfo ZhBaseItem",
    "系统操作记录 日志卡片 记录列表"
  ],
  timeline: [
    "时间线 Timeline 流程节点 历史记录 ZhDetailSubTitle ZhBaseInfo",
    "节点状态 处理人 处理结果 时间节点"
  ]
};

function normalizeInput(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function buildSummary(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}...` : text;
}

function toSubtask(rule: IntentRule): RequirementSubtask {
  return {
    id: rule.id,
    title: rule.title,
    intent: rule.intent,
    priority: rule.priority,
    uiRegion: rule.uiRegion,
    dataNeeds: rule.dataNeeds ?? [],
    interactionNeeds: rule.interactionNeeds ?? [],
    candidateKeywords: rule.candidateKeywords
  };
}

function shouldEnableDecomposition(text: string, matchedIntentCount: number): boolean {
  const connectorCount = COMPLEX_CONNECTORS.filter((word) => text.includes(word)).length;
  return text.length > 80 || connectorCount >= 2 || matchedIntentCount >= 3;
}

function shouldAlwaysEnableDecomposition(pageType: string): boolean {
  return pageType === "admin-home-dashboard" || pageType === "admin-detail" || pageType === "admin-create";
}

function buildModuleQueries(module: RequirementModule): string[] {
  const moduleQuery = [
    module.type,
    module.intent,
    module.layout,
    module.uiRegion,
    module.required ? "required" : "optional"
  ].filter(Boolean).join(" ");

  return [moduleQuery, ...(MODULE_QUERY_HINTS[module.type] ?? [])];
}

export function decomposeRequirement(input: string): RequirementDecomposition {
  const text = normalizeInput(input);
  const profile = matchRequirementPageProfile(text);
  const matchedRules = profile.rules.filter((rule) => includesAny(text, rule.terms));
  const enabled = shouldAlwaysEnableDecomposition(profile.pageType) || shouldEnableDecomposition(text, matchedRules.length);
  const subtasks = matchedRules.map(toSubtask);

  if (enabled && subtasks.length === 0) {
    subtasks.push({
      id: "main-ui",
      title: "主要界面",
      intent: "general-ui",
      priority: "must",
      dataNeeds: [],
      interactionNeeds: [],
      candidateKeywords: [text]
    });
  }

  return {
    enabled,
    summary: buildSummary(text),
    pageType: profile.pageType,
    userGoal: text,
    subtasks,
    modules: enabled ? profile.modules : undefined,
    constraints: enabled ? profile.constraints : [],
    risks: enabled ? ["原始需求较大，直接生成容易遗漏局部模块或交互"] : []
  };
}

export function buildDecompositionQueries(input: string, decomposition: RequirementDecomposition): string[] {
  if (!decomposition.enabled) return [input];

  const queries = [
    input,
    decomposition.summary,
    ...decomposition.subtasks.map((task) =>
      [task.title, task.intent, ...task.candidateKeywords].filter(Boolean).join(" ")
    ),
    ...(decomposition.modules ?? []).flatMap(buildModuleQueries)
  ];

  return Array.from(new Set(queries.map((query) => query.trim()).filter(Boolean)));
}
