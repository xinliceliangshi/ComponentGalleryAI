import type { KeywordCategory, QueryIntent, QueryToken } from "./types.js";
import { clamp } from "./utils.js";

const QUERY_INTENT_RULES: Record<KeywordCategory, string[]> = {
  component: ["组件", "表格", "table", "列表", "按钮", "输入", "输入框", "弹窗", "日期", "下拉", "卡片", "栅格", "页头", "副标题"],
  scenario: ["列表页", "详情页", "筛选区", "查询区", "顶部", "底栏", "管理页", "原型", "预约", "统计", "审核记录", "操作日志", "时间线"],
  feature: ["分页", "排序", "多选", "合计", "固定", "格式化", "上传", "下载", "配置", "范围", "跳转"],
  prop: ["props", "属性", "字段", "列名", "columns", "data", "datasource"],
  event: ["事件", "change", "click", "submit", "回调"],
  action: ["查询", "搜索", "重置", "清除", "保存", "取消", "确认", "点击", "跳到"],
  visual: ["蓝色", "主色", "标签", "状态", "图标", "圆角", "阴影", "加载", "有效", "取消"],
  layout: ["栅格", "网格", "两列", "多列", "顶部", "底部", "底栏", "左侧", "右侧", "旁边", "竖线"]
};

const QUERY_INTENT_MAX_BOOST = 1.25;
const QUERY_EXPANDED_TOKEN_WEIGHT = 0.15;

const QUERY_EXPANSION_RULES: Array<{ triggers: string[]; expands: string[] }> = [
  {
    triggers: ["弹层", "模态", "弹出框", "弹出层"],
    expands: ["弹窗", "对话框", "modal", "dialog"]
  },
  {
    triggers: ["弹窗表单", "表单弹窗", "表单校验", "校验失败"],
    expands: ["弹窗", "输入框", "表单", "字段", "错误提示"]
  },
  {
    triggers: ["统计指标", "指标卡", "数据卡片", "统计数据"],
    expands: ["KPI", "统计卡片", "关键指标", "页头"]
  },
  {
    triggers: ["附件", "文件区", "文件列表", "上传文件"],
    expands: ["文件", "附件区", "上传", "预览", "下载", "FileWrapper"]
  },
  {
    triggers: ["上传失败", "重新上传", "封面图", "海报", "素材上传"],
    expands: ["文件", "附件", "上传", "预览", "FileWrapper", "按钮"]
  },
  {
    triggers: ["金额输入", "预算金额", "商品价格", "售价", "原价", "成本价", "千分位"],
    expands: ["金额", "金额输入", "货币", "MoneyInput", "小数", "格式化"]
  },
  {
    triggers: ["报名人数", "人数上限", "限购数量", "课时数", "重量上限", "步进调整"],
    expands: ["数字输入", "数值输入", "InputNumber", "步进", "两位小数", "小数"]
  },
  {
    triggers: ["跳详情", "跳转详情", "可点击编号", "编号跳转"],
    expands: ["链接列", "点击", "路由", "详情页"]
  },
  {
    triggers: ["筛选", "查询条件", "检索条件", "过滤条件"],
    expands: ["筛选区", "查询区", "输入框", "下拉", "日期范围"]
  },
  {
    triggers: ["快捷入口", "快捷操作", "常用操作", "操作入口"],
    expands: ["按钮", "按钮组", "操作区", "新建", "导出"]
  },
  {
    triggers: ["左右两栏", "双栏", "两栏展示", "左侧右侧"],
    expands: ["栅格", "网格", "两列", "多列布局"]
  },
  {
    triggers: ["待办事项", "最近动态", "动态列表", "待办列表"],
    expands: ["列表", "表格", "数据表", "待办", "动态"]
  },
  {
    triggers: ["视频播放器", "播放 mp4", "播放视频", "视频播放", "播放地址"],
    expands: ["视频", "播放器", "VideoPlayer", "mp4", "全屏", "进度条"]
  },
  {
    triggers: ["详情页副标题", "状态副标题", "副标题区", "状态条"],
    expands: ["副标题", "状态", "编号信息", "有效", "已取消"]
  },
  {
    triggers: ["详情页头部", "详情头部", "详情页头", "标题状态操作区", "头部操作区"],
    expands: ["详情页头", "标题栏", "返回", "操作区", "DetailHeader"]
  },
  {
    triggers: ["状态驱动", "状态tag", "状态标签", "当前状态", "业务状态", "审核状态", "审批状态"],
    expands: ["状态副标题", "状态条", "副标题", "状态文案", "DetailSubTitle"]
  },
  {
    triggers: ["审核记录", "审批记录", "业务历史", "流转记录", "处理意见"],
    expands: ["基础信息", "详情信息", "记录卡片", "状态副标题", "处理意见"]
  },
  {
    triggers: ["操作日志", "操作记录", "系统操作记录", "日志时间线"],
    expands: ["基础信息", "详情信息", "记录卡片", "操作人", "操作时间"]
  },
  {
    triggers: ["时间线", "timeline", "流程节点", "历史节点"],
    expands: ["状态副标题", "流程节点", "历史记录", "基础信息"]
  },
  {
    triggers: ["地图模块", "地图", "marker", "点位"],
    expands: ["地图", "marker", "点位", "缩放", "定位"]
  },
  {
    triggers: ["信息展示", "键值展示", "详情字段", "基础信息区", "基础信息卡片"],
    expands: ["基础信息", "信息对", "键值对", "字段展示", "栅格"]
  },
  {
    triggers: ["二次确认", "删除确认", "保存确认", "未保存"],
    expands: ["确认弹窗", "提示弹窗", "MessageBox"]
  }
];

function tokenize(q: string): string[] {
  const normalized = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

  const parts = normalized
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);

  const extra: string[] = [];
  for (const p of parts) {
    if (p.length <= 1) continue;
    if (/[\u4e00-\u9fff]/.test(p)) {
      for (const ch of p) {
        if (/[\u4e00-\u9fff]/.test(ch)) extra.push(ch);
      }
    }
  }

  return [...parts, ...extra].slice(0, 40);
}

export function normalizeQueryWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function normalizeQueryTokens(tokens: QueryToken[]): QueryToken[] {
  const byWord = new Map<string, QueryToken>();
  for (const t of tokens) {
    const word = normalizeQueryWord(t.word);
    if (!word) continue;
    const existing = byWord.get(word);
    const next: QueryToken = {
      word,
      weight: Math.max(0, t.weight),
      source: t.source
    };
    if (!existing || next.weight > existing.weight || (next.source === "original" && existing.source !== "original")) {
      byWord.set(word, next);
    }
  }
  return Array.from(byWord.values());
}

export function buildQueryTokens(query: string): QueryToken[] {
  const tokens: QueryToken[] = tokenize(query).map((word) => ({
    word,
    weight: 1,
    source: "original"
  }));

  const hay = query.toLowerCase();
  for (const rule of QUERY_EXPANSION_RULES) {
    const matched = rule.triggers.some((trigger) => hay.includes(trigger.toLowerCase()));
    if (!matched) continue;
    for (const expand of rule.expands) {
      const word = normalizeQueryWord(expand);
      if (word) {
        tokens.push({ word, weight: QUERY_EXPANDED_TOKEN_WEIGHT, source: "expanded" });
      }
    }
  }

  return normalizeQueryTokens(tokens).slice(0, 80);
}

export function inferQueryIntent(query: string): QueryIntent {
  const hay = query.toLowerCase();
  const categories: Partial<Record<KeywordCategory, number>> = {};

  for (const [category, terms] of Object.entries(QUERY_INTENT_RULES) as Array<[KeywordCategory, string[]]>) {
    let hits = 0;
    for (const term of terms) {
      if (hay.includes(term.toLowerCase())) hits++;
    }
    if (hits > 0) {
      categories[category] = clamp(1 + hits * 0.05, 1, QUERY_INTENT_MAX_BOOST);
    }
  }

  return { categories };
}
