import type { KeywordCategory, QueryIntent, QueryToken } from "./types.js";
import { clamp } from "./utils.js";

const QUERY_INTENT_RULES: Record<KeywordCategory, string[]> = {
  component: ["组件", "表格", "table", "列表", "按钮", "输入", "输入框", "弹窗", "日期", "下拉", "卡片", "栅格"],
  scenario: ["列表页", "详情页", "筛选区", "查询区", "顶部", "底栏", "管理页", "原型", "预约", "统计"],
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
    triggers: ["统计指标", "指标卡", "数据卡片", "统计数据"],
    expands: ["KPI", "统计卡片", "关键指标", "页头"]
  },
  {
    triggers: ["附件", "文件区", "文件列表", "上传文件"],
    expands: ["文件", "附件区", "上传", "预览", "下载", "FileWrapper"]
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
    triggers: ["信息展示", "键值展示", "详情字段"],
    expands: ["基础信息", "信息对", "键值对", "字段展示"]
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
