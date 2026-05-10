import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";
import {
  ADMIN_CONTEXT_TERMS,
  CREATE_PAGE_TERMS,
  DETAIL_PAGE_TERMS,
  EDIT_INTENT_TERMS,
  LIST_PAGE_TERMS,
  countMatchedComplexGroups
} from "./admin-form-signals.js";

function isAdminEditPage(text: string): boolean {
  if (!includesAny(text, ADMIN_CONTEXT_TERMS)) return false;

  const hasEditIntent = includesAny(text, EDIT_INTENT_TERMS);
  const hasCreateIntent = includesAny(text, CREATE_PAGE_TERMS);
  const hasListIntent = includesAny(text, LIST_PAGE_TERMS);
  const hasDetailIntent = includesAny(text, DETAIL_PAGE_TERMS);
  const matchedComplexGroups = countMatchedComplexGroups(text);

  if (hasCreateIntent && matchedComplexGroups < 2) return false;
  if (hasListIntent) return false;
  if (hasDetailIntent) return false;
  if (hasEditIntent && matchedComplexGroups >= 2) return true;
  if (!hasCreateIntent && matchedComplexGroups >= 3) return true;

  return false;
}

export const adminEditProfile: RequirementPageProfile = {
  pageType: "admin-edit",
  match: isAdminEditPage,
  rules: [
    {
      id: "edit-header",
      title: "编辑页头部",
      intent: "edit-header",
      priority: "must",
      uiRegion: "header",
      terms: ["编辑", "修改", "维护", "配置", "标题", "返回", "操作按钮"],
      dataNeeds: ["页面标题", "对象标识", "当前状态"],
      interactionNeeds: ["返回上一页", "识别当前对象", "执行主操作"],
      candidateKeywords: ["编辑页头部", "标题栏", "状态标签", "操作按钮区"]
    },
    {
      id: "status-context",
      title: "状态上下文",
      intent: "edit-status-context",
      priority: "must",
      uiRegion: "top",
      terms: ["状态", "草稿", "审核", "发布", "下线", "锁定", "流转"],
      dataNeeds: ["状态值", "状态说明", "风险提示"],
      interactionNeeds: ["识别当前状态", "理解当前限制"],
      candidateKeywords: ["状态上下文", "状态横幅", "风险提示", "状态说明"]
    },
    {
      id: "editable-form",
      title: "可编辑表单区",
      intent: "editable-form",
      priority: "must",
      uiRegion: "main",
      terms: ["编辑", "修改", "字段", "填写", "配置", "表单"],
      dataNeeds: ["字段值", "默认值", "字段权限"],
      interactionNeeds: ["编辑字段", "查看只读字段", "修改配置"],
      candidateKeywords: ["编辑表单", "字段编辑", "只读字段", "表单布局"]
    },
    {
      id: "grouped-sections",
      title: "分组编辑区",
      intent: "grouped-edit-sections",
      priority: "should",
      uiRegion: "main",
      terms: ["基础信息", "高级设置", "分组", "模块", "卡片", "配置项"],
      dataNeeds: ["分组标题", "字段归类", "分组说明"],
      interactionNeeds: ["按模块编辑", "在分组间切换"],
      candidateKeywords: ["分组编辑", "卡片分组", "Section", "模块化表单"]
    },
    {
      id: "relation-editor",
      title: "关联数据编辑",
      intent: "relation-editor",
      priority: "should",
      uiRegion: "main",
      terms: ["关联数据", "子项", "标签", "角色", "规格", "明细配置"],
      dataNeeds: ["关联对象", "子项列表", "关系配置"],
      interactionNeeds: ["增删关联项", "维护子配置"],
      candidateKeywords: ["关联数据编辑", "子项配置", "关系维护", "标签选择"]
    },
    {
      id: "preview-panel",
      title: "预览区",
      intent: "preview-panel",
      priority: "should",
      uiRegion: "side",
      terms: ["预览", "实时预览", "效果预览", "结果预览"],
      dataNeeds: ["预览数据", "预览状态"],
      interactionNeeds: ["查看修改结果", "对照编辑效果"],
      candidateKeywords: ["预览区", "实时预览", "侧边预览", "效果预览"]
    },
    {
      id: "validation-diff",
      title: "校验与变更提示",
      intent: "validation-diff",
      priority: "must",
      uiRegion: "top",
      terms: ["校验", "必填", "错误提示", "变更", "差异", "对比"],
      dataNeeds: ["错误信息", "变更摘要", "字段状态"],
      interactionNeeds: ["定位问题", "查看改动", "确认提交风险"],
      candidateKeywords: ["校验提示", "变更提示", "差异摘要", "错误汇总"]
    },
    {
      id: "history-panel",
      title: "变更历史",
      intent: "change-history",
      priority: "should",
      uiRegion: "bottom",
      terms: ["变更记录", "操作日志", "版本记录", "修改历史", "差异对比"],
      dataNeeds: ["操作人", "时间", "修改内容"],
      interactionNeeds: ["查看历史", "回顾变更过程"],
      candidateKeywords: ["变更记录", "版本记录", "操作日志", "历史时间线"]
    },
    {
      id: "edit-actions",
      title: "编辑操作区",
      intent: "edit-actions",
      priority: "must",
      uiRegion: "footer",
      terms: ["保存", "提交审核", "发布", "下线", "取消", "保存草稿"],
      dataNeeds: ["可执行操作", "权限规则", "状态流转"],
      interactionNeeds: ["保存修改", "提交流转", "取消离开"],
      candidateKeywords: ["编辑操作区", "底部操作栏", "保存修改", "发布按钮"]
    }
  ],
  modules: [
    {
      type: "editHeader",
      required: true,
      priority: "must",
      layout: "header-title-status-actions",
      intent: "edit-header",
      uiRegion: "header",
      sourceSubtaskId: "edit-header"
    },
    {
      type: "statusBanner",
      required: true,
      priority: "must",
      layout: "status-context-banner",
      intent: "edit-status-context",
      uiRegion: "top",
      sourceSubtaskId: "status-context"
    },
    {
      type: "editableForm",
      required: true,
      priority: "must",
      layout: "primary-edit-form",
      intent: "editable-form",
      uiRegion: "main",
      sourceSubtaskId: "editable-form"
    },
    {
      type: "groupedEditSections",
      required: false,
      priority: "should",
      layout: "stacked-edit-sections",
      intent: "grouped-edit-sections",
      uiRegion: "main",
      sourceSubtaskId: "grouped-sections"
    },
    {
      type: "relationEditor",
      required: false,
      priority: "should",
      layout: "relation-config-card",
      intent: "relation-editor",
      uiRegion: "main",
      sourceSubtaskId: "relation-editor"
    },
    {
      type: "previewPanel",
      required: false,
      priority: "should",
      layout: "side-preview-panel",
      intent: "preview-panel",
      uiRegion: "side",
      sourceSubtaskId: "preview-panel"
    },
    {
      type: "validationDiffSummary",
      required: true,
      priority: "must",
      layout: "inline-validation-diff-summary",
      intent: "validation-diff",
      uiRegion: "top",
      sourceSubtaskId: "validation-diff"
    },
    {
      type: "changeHistory",
      required: false,
      priority: "should",
      layout: "history-timeline-card",
      intent: "change-history",
      uiRegion: "bottom",
      sourceSubtaskId: "history-panel"
    },
    {
      type: "editActionBar",
      required: true,
      priority: "must",
      layout: "sticky-footer-multi-actions",
      intent: "edit-actions",
      uiRegion: "footer",
      sourceSubtaskId: "edit-actions"
    }
  ],
  constraints: [
    "必须覆盖所有 must 子任务",
    "复杂编辑页不能等同于新增页回填，必须体现当前状态和编辑上下文",
    "页面主体允许表单、只读信息、关联配置、预览区混合布局",
    "必须体现字段可编辑、只读、禁用等不同状态",
    "必须体现校验、错误提示、变更提示等编辑反馈",
    "底部操作区必须区分取消、保存、提交审核、发布等不同动作",
    "若涉及发布流或审核流，操作按钮必须根据状态和权限动态变化",
    "若页面内容较长，应按分组卡片组织，不要把所有字段平铺成单一表单块"
  ]
};
