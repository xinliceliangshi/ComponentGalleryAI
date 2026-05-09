import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";

export const adminManagementProfile: RequirementPageProfile = {
  pageType: "admin-management",
  match: (text) => includesAny(text, ["后台", "管理", "列表", "表格"]),
  rules: [
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
  ],
  constraints: [
    "必须覆盖所有 must 子任务",
    "should 子任务尽量在页面中体现",
    "若需求涉及表格/列表/数据表格，优先使用 ZhTable / ZhDiyDataTable"
  ]
};
