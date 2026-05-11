import type { RequirementSectionKind } from "../requirement-decomposition/types.js";

export type SectionComponentPolicy = {
  title: string;
  goals: string[];
  notes?: string[];
  preferredComponents: Array<{
    name: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
};

export const SECTION_COMPONENT_POLICY: Record<RequirementSectionKind, SectionComponentPolicy> = {
  "page-header": {
    title: "页面头部",
    goals: ["展示页面标题", "提供返回入口", "展示主操作入口"],
    preferredComponents: [
      { name: "ZhDetailHeader", reason: "适合承载标题、状态和操作区", priority: "high" },
      { name: "ZhPageHeadPanel", reason: "适合首页或页面头部摘要区", priority: "medium" },
      { name: "ZhButton", reason: "承载保存、提交、返回等动作", priority: "high" }
    ]
  },
  "status-banner": {
    title: "状态横幅",
    goals: ["展示当前状态", "提示状态限制或风险", "补充状态说明文案"],
    preferredComponents: [
      { name: "ZhDetailSubTitle", reason: "适合展示状态副标题和状态说明", priority: "high" },
      { name: "ZhTag", reason: "适合承载状态标签", priority: "medium" }
    ]
  },
  "status-actions": {
    title: "状态操作区",
    goals: ["围绕状态展示可执行动作", "体现权限与动作关系"],
    preferredComponents: [
      { name: "ZhButtonGroup", reason: "适合组织状态相关按钮组", priority: "high" },
      { name: "ZhButton", reason: "承载单个操作动作", priority: "high" }
    ]
  },
  "validation-summary": {
    title: "校验提示区",
    goals: ["汇总必填和错误提示", "提示变更风险或提交风险"],
    preferredComponents: [
      { name: "ZhAlert", reason: "适合承载校验和风险提示", priority: "medium" },
      { name: "ZhForm", reason: "适合联动表单校验状态", priority: "high" }
    ]
  },
  "form-body": {
    title: "主表单区",
    goals: ["承载主要录入字段", "支持输入、选择和校验反馈"],
    notes: ["字段较多时应配合 grouped-form 组织", "避免把所有字段无层次平铺"],
    preferredComponents: [
      { name: "ZhForm", reason: "适合承载整页录入表单", priority: "high" },
      { name: "ZhInput", reason: "适合文本字段输入", priority: "medium" },
      { name: "ZhSelect", reason: "适合枚举类字段选择", priority: "medium" }
    ]
  },
  "grouped-form": {
    title: "分组表单区",
    goals: ["按业务模块组织长表单", "把字段拆成更易读的卡片分组"],
    preferredComponents: [
      { name: "ZhCollapse", reason: "适合折叠或分组长内容", priority: "low" },
      { name: "ZhCard", reason: "适合按卡片组织表单分组", priority: "medium" }
    ]
  },
  "upload-panel": {
    title: "上传区",
    goals: ["支持图片或附件上传", "展示上传结果和状态"],
    preferredComponents: [
      { name: "ZhFileWrapper", reason: "适合展示文件、图片、附件内容", priority: "high" },
      { name: "ZhButton", reason: "可承载上传、删除、重试等动作", priority: "medium" }
    ]
  },
  "relation-editor": {
    title: "关联数据编辑区",
    goals: ["维护关联对象或子项配置", "支持增删改关联项"],
    preferredComponents: [
      { name: "ZhTable", reason: "适合承载关联项列表和子项编辑", priority: "medium" },
      { name: "ZhSelect", reason: "适合选择关联对象或标签", priority: "medium" }
    ]
  },
  "preview-panel": {
    title: "预览区",
    goals: ["展示当前配置的预览效果", "帮助用户对照编辑结果"],
    preferredComponents: [
      { name: "ZhFileWrapper", reason: "适合展示富内容、图片或附件预览", priority: "medium" },
      { name: "ZhVideoPlayer", reason: "适合视频类内容预览", priority: "low" }
    ]
  },
  "history-panel": {
    title: "历史记录区",
    goals: ["展示变更记录或操作历史", "按时间回顾修改过程"],
    preferredComponents: [
      { name: "ZhBaseInfo", reason: "适合展示历史记录条目", priority: "medium" },
      { name: "ZhDetailSubTitle", reason: "适合分隔历史章节和标题", priority: "low" }
    ]
  },
  "base-info": {
    title: "基础信息区",
    goals: ["展示基础字段信息", "以键值对方式呈现详情"],
    preferredComponents: [
      { name: "ZhBaseInfo", reason: "适合展示基础信息卡片", priority: "high" },
      { name: "ZhBaseItem", reason: "适合承载单个信息项", priority: "high" },
      { name: "ZhGrid", reason: "适合多列信息布局", priority: "medium" }
    ]
  },
  "content-detail": {
    title: "内容详情区",
    goals: ["展示富文本、图片或引用内容", "承载详情正文内容"],
    preferredComponents: [
      { name: "ZhFileWrapper", reason: "适合展示附件、图片和富内容", priority: "high" },
      { name: "ZhToolTips", reason: "适合补充说明和细节提示", priority: "low" }
    ]
  },
  "audit-records": {
    title: "审核记录区",
    goals: ["展示审核流转过程", "呈现审核人、时间和结果"],
    preferredComponents: [
      { name: "ZhBaseInfo", reason: "适合组织审核记录信息", priority: "high" },
      { name: "ZhDetailSubTitle", reason: "适合分隔审核阶段信息", priority: "medium" }
    ]
  },
  "operation-log": {
    title: "操作日志区",
    goals: ["展示系统操作记录", "按时间查看操作明细"],
    preferredComponents: [
      { name: "ZhBaseInfo", reason: "适合组织操作日志信息", priority: "medium" },
      { name: "ZhBaseItem", reason: "适合展示日志字段", priority: "medium" }
    ]
  },
  timeline: {
    title: "时间线区",
    goals: ["按时间顺序展示流程节点", "帮助用户快速回顾节点变化"],
    preferredComponents: [
      { name: "ZhDetailSubTitle", reason: "适合作为时间线节点标题", priority: "low" },
      { name: "ZhBaseInfo", reason: "适合承载节点详情", priority: "medium" }
    ]
  },
  "action-footer": {
    title: "底部操作区",
    goals: ["提供取消、保存、提交等操作", "区分主次动作按钮"],
    preferredComponents: [
      { name: "ZhButtonGroup", reason: "适合组织底部多操作按钮", priority: "high" },
      { name: "ZhButton", reason: "承载取消、保存、提交等单个动作", priority: "high" }
    ]
  }
};
