import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";

const ADMIN_CONTEXT_TERMS = ["后台", "管理", "管理系统", "运营"];
const CREATE_PAGE_TERMS = ["新增", "新建", "创建", "录入"];
const EXCLUDED_TERMS = ["列表", "表格", "分页", "筛选", "查询", "详情页", "审核详情", "审批详情"];

function isAdminCreatePage(text: string): boolean {
  return includesAny(text, ADMIN_CONTEXT_TERMS)
    && includesAny(text, CREATE_PAGE_TERMS)
    && !includesAny(text, EXCLUDED_TERMS);
}

export const adminCreateProfile: RequirementPageProfile = {
  pageType: "admin-create",
  match: isAdminCreatePage,
  rules: [
    {
      id: "create-header",
      title: "新增页头部",
      intent: "create-header",
      priority: "must",
      uiRegion: "header",
      terms: ["新增", "新建", "创建", "录入", "标题", "返回", "取消"],
      dataNeeds: ["页面标题", "当前模式", "操作文案"],
      interactionNeeds: ["返回上一页", "识别当前表单目标"],
      candidateKeywords: ["新增页头部", "标题栏", "返回按钮", "操作按钮区"]
    },
    {
      id: "basic-form",
      title: "主表单区",
      intent: "create-form",
      priority: "must",
      uiRegion: "main",
      terms: ["表单", "填写", "录入", "输入", "选择", "提交", "字段"],
      dataNeeds: ["表单字段", "默认值", "字段分组"],
      interactionNeeds: ["填写字段", "选择选项", "提交前检查"],
      candidateKeywords: ["表单", "输入框", "选择器", "日期", "开关", "表单布局"]
    },
    {
      id: "group-sections",
      title: "分组卡片区",
      intent: "grouped-form-sections",
      priority: "should",
      uiRegion: "main",
      terms: ["基础信息", "配置信息", "高级设置", "分组", "模块", "卡片"],
      dataNeeds: ["分组标题", "字段分组", "分组说明"],
      interactionNeeds: ["按分组填写长表单"],
      candidateKeywords: ["卡片表单", "分组表单", "表单分区", "Section"]
    },
    {
      id: "upload",
      title: "上传附件",
      intent: "file-upload",
      priority: "should",
      uiRegion: "main",
      terms: ["上传", "图片", "附件", "封面", "素材", "导入", "文件"],
      dataNeeds: ["文件列表", "文件地址", "上传状态"],
      interactionNeeds: ["选择文件", "上传文件", "删除文件"],
      candidateKeywords: ["上传", "附件", "图片上传", "文件选择"]
    },
    {
      id: "field-validation",
      title: "字段校验与提示",
      intent: "form-validation",
      priority: "must",
      uiRegion: "top",
      terms: ["校验", "必填", "错误提示", "校验规则", "格式校验"],
      dataNeeds: ["必填规则", "错误文案", "字段状态"],
      interactionNeeds: ["查看错误提示", "定位未填写字段"],
      candidateKeywords: ["表单校验", "必填提示", "错误提示", "校验规则"]
    },
    {
      id: "draft-save",
      title: "草稿保存",
      intent: "draft-save",
      priority: "should",
      uiRegion: "footer",
      terms: ["草稿", "暂存", "保存", "保存草稿"],
      interactionNeeds: ["暂存未完成内容", "继续编辑"],
      candidateKeywords: ["保存草稿", "暂存", "草稿态", "次操作按钮"]
    },
    {
      id: "submit-actions",
      title: "提交操作区",
      intent: "submit-actions",
      priority: "must",
      uiRegion: "footer",
      terms: ["提交", "保存", "取消", "确认", "发布"],
      interactionNeeds: ["取消编辑", "保存表单", "提交数据"],
      candidateKeywords: ["提交按钮", "底部操作栏", "保存", "取消"]
    }
  ],
  modules: [
    {
      type: "createHeader",
      required: true,
      priority: "must",
      layout: "header-title-back-actions",
      intent: "create-header",
      uiRegion: "header",
      sourceSubtaskId: "create-header"
    },
    {
      type: "formSection",
      required: true,
      priority: "must",
      layout: "primary-form-card",
      intent: "create-form",
      uiRegion: "main",
      sourceSubtaskId: "basic-form"
    },
    {
      type: "groupedCardSections",
      required: false,
      priority: "should",
      layout: "stacked-form-sections",
      intent: "grouped-form-sections",
      uiRegion: "main",
      sourceSubtaskId: "group-sections"
    },
    {
      type: "uploadAttachments",
      required: false,
      priority: "should",
      layout: "upload-card",
      intent: "file-upload",
      uiRegion: "main",
      sourceSubtaskId: "upload"
    },
    {
      type: "validationSummary",
      required: true,
      priority: "must",
      layout: "inline-validation-summary",
      intent: "form-validation",
      uiRegion: "top",
      sourceSubtaskId: "field-validation"
    },
    {
      type: "submitBar",
      required: true,
      priority: "must",
      layout: "sticky-footer-actions",
      intent: "submit-actions",
      uiRegion: "footer",
      sourceSubtaskId: "submit-actions"
    }
  ],
  constraints: [
    "必须覆盖所有 must 子任务",
    "页面主体必须是表单录入，不要生成成 CRUD 列表页或详情页",
    "不允许让表格成为新增页主体",
    "长表单应按分组卡片组织，不要把所有字段平铺成一个块",
    "提交区必须明确区分取消、保存/保存草稿、提交等操作",
    "必须体现必填、校验、错误提示等表单反馈"
  ]
};
