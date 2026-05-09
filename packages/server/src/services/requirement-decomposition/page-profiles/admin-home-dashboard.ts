import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";

const ADMIN_HOME_TERMS = ["首页", "工作台", "控制台", "仪表盘", "看板", "概览", "总览", "dashboard", "Dashboard"];
const ADMIN_CONTEXT_TERMS = ["后台", "管理系统", "运营", "数据", "统计", "管理"];

export const adminHomeDashboardProfile: RequirementPageProfile = {
  pageType: "admin-home-dashboard",
  match: (text) => includesAny(text, ADMIN_HOME_TERMS) && includesAny(text, ADMIN_CONTEXT_TERMS),
  rules: [
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
  ],
  constraints: [
    "必须覆盖所有 must 子任务",
    "should 子任务尽量在页面中体现",
    "后台首页必须体现核心指标、趋势/统计、待办或快捷入口",
    "不要把首页生成成单一 CRUD 表格页；表格只能作为辅助模块，不能成为页面主体"
  ]
};
