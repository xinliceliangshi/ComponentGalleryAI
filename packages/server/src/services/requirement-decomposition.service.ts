export type RequirementSubtaskPriority = "must" | "should" | "nice";

export type RequirementSubtask = {
  id: string;
  title: string;
  intent: string;
  priority: RequirementSubtaskPriority;
  uiRegion?: string;
  dataNeeds: string[];
  interactionNeeds: string[];
  candidateKeywords: string[];
};

export type RequirementDecomposition = {
  enabled: boolean;
  summary: string;
  pageType: string;
  userGoal: string;
  subtasks: RequirementSubtask[];
  constraints: string[];
  risks: string[];
};

type IntentRule = {
  id: string;
  title: string;
  intent: string;
  priority: RequirementSubtaskPriority;
  uiRegion?: string;
  terms: string[];
  dataNeeds?: string[];
  interactionNeeds?: string[];
  candidateKeywords: string[];
};

const COMPLEX_CONNECTORS = ["包含", "支持", "同时", "以及", "并且", "需要", "还要", "包括", "实现", "带有", "具备"];
const ADMIN_HOME_TERMS = ["首页", "工作台", "控制台", "仪表盘", "看板", "概览", "总览", "dashboard", "Dashboard"];
const ADMIN_CONTEXT_TERMS = ["后台", "管理系统", "运营", "数据", "统计", "管理"];

const ADMIN_HOME_RULES: IntentRule[] = [
  {
    id: "kpi-overview",
    title: "核心指标概览",
    intent: "dashboard-kpi",
    priority: "must",
    uiRegion: "top",
    terms: ["首页", "工作台", "控制台", "仪表盘", "看板", "概览", "总览", "指标", "数据", "统计"],
    dataNeeds: ["核心指标", "同比环比", "今日数据"],
    interactionNeeds: ["查看关键经营状态"],
    candidateKeywords: ["统计卡片", "指标", "总览", "数据概览", "核心指标"]
  },
  {
    id: "trend-chart",
    title: "趋势图表",
    intent: "dashboard-trend",
    priority: "must",
    uiRegion: "main",
    terms: ["趋势", "图表", "统计", "可视化", "走势", "折线", "柱状"],
    dataNeeds: ["趋势数据", "时间序列数据"],
    interactionNeeds: ["查看趋势变化"],
    candidateKeywords: ["图表", "趋势", "折线图", "统计", "可视化"]
  },
  {
    id: "todo-list",
    title: "待办事项",
    intent: "task-list",
    priority: "should",
    uiRegion: "side",
    terms: ["待办", "任务", "审批", "提醒", "预警", "告警"],
    dataNeeds: ["待办列表", "优先级", "截止时间"],
    interactionNeeds: ["查看待办", "进入处理"],
    candidateKeywords: ["待办", "任务", "审批", "提醒", "列表"]
  },
  {
    id: "quick-actions",
    title: "快捷入口",
    intent: "quick-actions",
    priority: "should",
    uiRegion: "middle",
    terms: ["快捷", "入口", "常用", "操作", "导航", "新建", "发布"],
    interactionNeeds: ["快速跳转", "触发常用操作"],
    candidateKeywords: ["快捷入口", "快捷操作", "按钮", "导航"]
  },
  {
    id: "recent-activity",
    title: "最近动态",
    intent: "activity-feed",
    priority: "nice",
    uiRegion: "bottom",
    terms: ["动态", "日志", "消息", "记录", "公告"],
    dataNeeds: ["动态列表", "消息时间", "操作人"],
    interactionNeeds: ["查看最新变化"],
    candidateKeywords: ["最近动态", "日志", "消息", "操作记录", "公告"]
  }
];

const INTENT_RULES: IntentRule[] = [
  {
    id: "filter",
    title: "筛选查询区",
    intent: "form-filter",
    priority: "must",
    uiRegion: "top",
    terms: ["筛选", "过滤", "搜索", "查询", "检索", "条件"],
    interactionNeeds: ["输入查询条件", "触发查询", "重置条件"],
    candidateKeywords: ["筛选", "搜索", "查询", "表单", "输入框", "日期"]
  },
  {
    id: "table",
    title: "数据表格",
    intent: "data-table",
    priority: "must",
    uiRegion: "main",
    terms: ["表格", "列表", "数据表", "数据表格", "明细"],
    dataNeeds: ["列配置", "行数据"],
    interactionNeeds: ["查看列表数据"],
    candidateKeywords: ["表格", "列表", "数据表格", "ZhTable", "ZhDiyDataTable"]
  },
  {
    id: "pagination",
    title: "分页控制",
    intent: "pagination",
    priority: "must",
    uiRegion: "bottom",
    terms: ["分页", "翻页", "页码", "每页"],
    interactionNeeds: ["切换页码", "调整每页条数"],
    candidateKeywords: ["分页", "表格", "列表"]
  },
  {
    id: "batch-actions",
    title: "批量操作",
    intent: "batch-actions",
    priority: "should",
    uiRegion: "table-toolbar",
    terms: ["批量", "多选", "勾选", "选择多条", "批量删除", "批量导出"],
    interactionNeeds: ["选择多行", "执行批量操作"],
    candidateKeywords: ["批量操作", "多选", "按钮", "表格"]
  },
  {
    id: "detail-drawer",
    title: "详情抽屉",
    intent: "drawer-detail",
    priority: "should",
    uiRegion: "side-panel",
    terms: ["抽屉", "侧边", "侧滑", "详情"],
    dataNeeds: ["详情字段"],
    interactionNeeds: ["打开详情", "关闭详情"],
    candidateKeywords: ["详情", "抽屉", "信息展示", "描述列表"]
  },
  {
    id: "edit-dialog",
    title: "编辑弹窗",
    intent: "modal-form",
    priority: "should",
    uiRegion: "modal",
    terms: ["弹窗", "对话框", "新增", "新建", "编辑", "修改", "表单"],
    dataNeeds: ["表单字段", "校验规则"],
    interactionNeeds: ["打开表单", "提交保存", "取消关闭"],
    candidateKeywords: ["弹窗", "对话框", "表单", "输入", "按钮"]
  },
  {
    id: "upload",
    title: "文件上传",
    intent: "file-upload",
    priority: "should",
    terms: ["上传", "附件", "文件", "导入"],
    dataNeeds: ["文件列表"],
    interactionNeeds: ["选择文件", "上传文件", "删除文件"],
    candidateKeywords: ["上传", "文件", "附件", "导入"]
  },
  {
    id: "charts",
    title: "图表展示",
    intent: "chart-dashboard",
    priority: "should",
    uiRegion: "main",
    terms: ["图表", "趋势", "统计", "看板", "仪表盘", "可视化"],
    dataNeeds: ["指标数据", "趋势数据"],
    candidateKeywords: ["图表", "统计", "看板", "趋势"]
  },
  {
    id: "status-permission",
    title: "状态与权限呈现",
    intent: "status-permission",
    priority: "should",
    terms: ["状态", "权限", "角色", "启用", "禁用", "审核", "标签"],
    dataNeeds: ["状态字段", "角色字段"],
    interactionNeeds: ["切换状态", "识别权限"],
    candidateKeywords: ["状态", "权限", "标签", "开关", "按钮"]
  }
];

function normalizeInput(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function isAdminHomeDashboard(text: string): boolean {
  return includesAny(text, ADMIN_HOME_TERMS) && includesAny(text, ADMIN_CONTEXT_TERMS);
}

function inferPageType(text: string): string {
  if (isAdminHomeDashboard(text)) return "admin-home-dashboard";
  if (includesAny(text, ["后台", "管理", "列表", "表格"])) return "admin-management";
  if (includesAny(text, ["看板", "仪表盘", "统计", "图表"])) return "dashboard";
  if (includesAny(text, ["表单", "填写", "提交", "申请"])) return "form-page";
  if (includesAny(text, ["详情", "资料", "信息"])) return "detail-page";
  return "general-ui";
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

export function decomposeRequirement(input: string): RequirementDecomposition {
  const text = normalizeInput(input);
  const pageType = inferPageType(text);
  const ruleSet = pageType === "admin-home-dashboard" ? ADMIN_HOME_RULES : INTENT_RULES;
  const matchedRules = ruleSet.filter((rule) => includesAny(text, rule.terms));
  const enabled = pageType === "admin-home-dashboard" || shouldEnableDecomposition(text, matchedRules.length);
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
    pageType,
    userGoal: text,
    subtasks,
    constraints: enabled
      ? pageType === "admin-home-dashboard"
        ? [
            "必须覆盖所有 must 子任务",
            "should 子任务尽量在页面中体现",
            "后台首页必须体现核心指标、趋势/统计、待办或快捷入口",
            "不要把首页生成成单一 CRUD 表格页；表格只能作为辅助模块，不能成为页面主体"
          ]
        : [
            "必须覆盖所有 must 子任务",
            "should 子任务尽量在页面中体现",
            "若需求涉及表格/列表/数据表格，优先使用 ZhTable / ZhDiyDataTable"
          ]
      : [],
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
    )
  ];

  return Array.from(new Set(queries.map((query) => query.trim()).filter(Boolean)));
}
