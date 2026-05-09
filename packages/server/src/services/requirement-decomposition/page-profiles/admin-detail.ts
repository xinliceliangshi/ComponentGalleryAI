import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";

const ADMIN_CONTEXT_TERMS = ["后台", "管理系统", "运营", "审核", "审批", "权限"];
const DETAIL_PAGE_TERMS = ["详情页", "详情页面", "审核详情", "审批详情", "订单详情", "内容详情", "工单详情", "用户详情"];
const MANAGEMENT_LIST_TERMS = ["列表", "表格", "分页", "筛选", "查询", "批量", "多选"];
const CREATE_PAGE_TERMS = ["新增", "新建", "创建", "录入"];

function isAdminDetailPage(text: string): boolean {
  const hasDetailSignal = includesAny(text, DETAIL_PAGE_TERMS)
    || (includesAny(text, ["详情", "明细", "资料"]) && includesAny(text, ["状态", "审核记录", "操作日志", "基础信息"]));

  return hasDetailSignal
    && includesAny(text, ADMIN_CONTEXT_TERMS)
    && !includesAny(text, CREATE_PAGE_TERMS)
    && !includesAny(text, MANAGEMENT_LIST_TERMS);
}

export const adminDetailProfile: RequirementPageProfile = {
  pageType: "admin-detail",
  match: isAdminDetailPage,
  rules: [
    {
      id: "detail-header",
      title: "详情页头部",
      intent: "detail-header",
      priority: "must",
      uiRegion: "header",
      terms: ["详情", "详情页", "标题", "Header", "头部", "操作按钮", "按钮区"],
      dataNeeds: ["标题", "状态", "核心摘要"],
      interactionNeeds: ["查看详情标题", "识别当前状态"],
      candidateKeywords: ["详情页头部", "标题", "状态标签", "操作按钮", "Header"]
    },
    {
      id: "status-summary",
      title: "状态驱动 UI",
      intent: "status-driven-ui",
      priority: "must",
      uiRegion: "top",
      terms: ["状态", "状态Tag", "状态标签", "待审核", "已通过", "已拒绝", "草稿", "处理中"],
      dataNeeds: ["业务状态", "状态文案", "状态样式"],
      interactionNeeds: ["根据状态显示不同文案"],
      candidateKeywords: ["状态", "标签", "Tag", "状态驱动", "状态文案"]
    },
    {
      id: "status-actions",
      title: "状态关联操作",
      intent: "status-action-permission",
      priority: "must",
      uiRegion: "header-actions",
      terms: ["操作", "按钮", "权限", "行为", "通过", "拒绝", "撤回", "提交", "重新审核"],
      dataNeeds: ["可用操作", "权限规则", "状态流转"],
      interactionNeeds: ["根据状态和权限展示按钮", "触发业务操作"],
      candidateKeywords: ["操作按钮", "权限", "状态流转", "按钮组", "行为"]
    },
    {
      id: "base-info",
      title: "基础信息区",
      intent: "base-info-descriptions",
      priority: "must",
      uiRegion: "main",
      terms: ["基础信息", "基本信息", "资料", "字段", "描述", "Descriptions", "Grid"],
      dataNeeds: ["基础字段", "关联对象", "创建时间"],
      interactionNeeds: ["查看基础字段"],
      candidateKeywords: ["基础信息", "Descriptions", "描述列表", "Grid", "信息卡片"]
    },
    {
      id: "content-detail",
      title: "内容详情区",
      intent: "rich-content-detail",
      priority: "should",
      uiRegion: "main",
      terms: ["内容", "正文", "富文本", "markdown", "html", "图片", "引用", "code block", "代码"],
      dataNeeds: ["富文本内容", "图片资源", "代码片段"],
      interactionNeeds: ["查看富内容详情"],
      candidateKeywords: ["内容详情", "富文本", "Markdown", "图片预览", "代码块", "引用"]
    },
    {
      id: "audit-records",
      title: "审核记录",
      intent: "audit-history",
      priority: "must",
      uiRegion: "main",
      terms: ["审核", "审核记录", "审批", "审批记录", "业务历史", "流转", "处理意见"],
      dataNeeds: ["审核人", "审核时间", "审核结果", "审核意见"],
      interactionNeeds: ["查看业务流转历史"],
      candidateKeywords: ["审核记录", "审批记录", "业务历史", "流转记录", "处理意见"]
    },
    {
      id: "operation-log",
      title: "操作日志",
      intent: "operation-log",
      priority: "should",
      uiRegion: "bottom",
      terms: ["操作日志", "日志", "记录", "操作人", "操作时间"],
      dataNeeds: ["操作人", "操作时间", "操作内容"],
      interactionNeeds: ["查看系统操作记录"],
      candidateKeywords: ["操作日志", "日志", "操作记录", "记录列表"]
    },
    {
      id: "timeline",
      title: "日志时间线",
      intent: "timeline",
      priority: "should",
      uiRegion: "bottom",
      terms: ["时间线", "Timeline", "流程", "节点", "历史"],
      dataNeeds: ["时间节点", "节点状态", "节点描述"],
      interactionNeeds: ["按时间查看历史节点"],
      candidateKeywords: ["时间线", "Timeline", "流程节点", "历史记录"]
    }
  ],
  modules: [
    {
      type: "detailHeader",
      required: true,
      priority: "must",
      layout: "header-title-status-actions",
      intent: "detail-header",
      uiRegion: "header",
      sourceSubtaskId: "detail-header"
    },
    {
      type: "statusSummary",
      required: true,
      priority: "must",
      layout: "status-driven-banner",
      intent: "status-driven-ui",
      uiRegion: "top",
      sourceSubtaskId: "status-summary"
    },
    {
      type: "statusActions",
      required: true,
      priority: "must",
      layout: "permission-aware-button-group",
      intent: "status-action-permission",
      uiRegion: "header-actions",
      sourceSubtaskId: "status-actions"
    },
    {
      type: "baseInfo",
      required: true,
      priority: "must",
      layout: "descriptions-grid",
      intent: "base-info-descriptions",
      uiRegion: "main",
      sourceSubtaskId: "base-info"
    },
    {
      type: "contentDetail",
      required: false,
      priority: "should",
      layout: "rich-content-card",
      intent: "rich-content-detail",
      uiRegion: "main",
      sourceSubtaskId: "content-detail"
    },
    {
      type: "auditRecords",
      required: true,
      priority: "must",
      layout: "business-history-card",
      intent: "audit-history",
      uiRegion: "main",
      sourceSubtaskId: "audit-records"
    },
    {
      type: "operationLog",
      required: false,
      priority: "should",
      layout: "operation-log-card",
      intent: "operation-log",
      uiRegion: "bottom",
      sourceSubtaskId: "operation-log"
    },
    {
      type: "timeline",
      required: false,
      priority: "should",
      layout: "vertical-timeline",
      intent: "timeline",
      uiRegion: "bottom",
      sourceSubtaskId: "timeline"
    }
  ],
  constraints: [
    "必须包含 Header：标题、状态 Tag、操作按钮区",
    "顶部必须体现状态驱动 UI，并根据不同状态显示不同文字",
    "操作按钮必须围绕 状态 → 按钮 → 权限 → 行为 组织",
    "基础信息区优先使用 Descriptions + Grid 的布局",
    "审核记录必须体现业务行为历史，不能和普通操作日志混为一谈",
    "内容详情区可按需求展示 markdown、html、图片、引用或 code block",
    "操作日志和时间线可作为辅助模块",
    "不要把后台详情页生成成列表页或 CRUD 表格页"
  ]
};
