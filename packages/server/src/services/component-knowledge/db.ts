import fs from "fs";
import path from "path";
import { env } from "../../config/env.js";
import { keywordWords, keywordsForComponent } from "./keyword-patches.js";
import type { Chunk, KnowledgeDb, SearchComponent, ToolCard } from "./types.js";
import { safeLower } from "./utils.js";

let cached: KnowledgeDb | null = null;

function defaultDataDir(): string {
  return path.join(process.cwd(), "packages/server/resources/component-gallery-ai");
}

function resolveDataDir(): string {
  return env.componentDataDir || defaultDataDir();
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function readJsonlFile(filePath: string, limitLines = 4000): Chunk[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const out: Chunk[] = [];
  for (const line of lines.slice(0, limitLines)) {
    const l = line.trim();
    if (!l) continue;
    try {
      out.push(JSON.parse(l) as Chunk);
    } catch {
      // ignore broken lines
    }
  }
  return out;
}

function loadLegacyDb(): KnowledgeDb {
  const dir = resolveDataDir();
  const toolCardsPath = path.join(dir, "tool-cards.json");
  const chunksPath = path.join(dir, "component-chunks.jsonl");

  const toolCards = fs.existsSync(toolCardsPath) ? readJsonFile<ToolCard[]>(toolCardsPath) : [];
  const chunks = readJsonlFile(chunksPath);
  return { toolCards, chunks };
}

function loadSearchJsonDb(): KnowledgeDb {
  const p = env.componentSearchJsonPath;
  if (!p || !fs.existsSync(p)) return { toolCards: [], chunks: [] };

  const list = readJsonFile<SearchComponent[]>(p);
  const toolCards: ToolCard[] = [];
  const chunks: Chunk[] = [];

  const synonymById: Record<string, string[]> = {
    ZhInput: ["输入", "输入框", "文本输入", "搜索框", "关键字", "关键字输入", "模糊查询", "回车搜索", "编号输入"],
    ZhButton: ["按钮", "查询按钮", "重置按钮", "搜索按钮", "确认按钮", "取消按钮"],
    ZhButtonGroup: ["按钮组", "操作区", "一排按钮", "批量操作"],
    ZhDatePicker: ["日期", "时间", "日期范围", "时间范围", "起止时间", "下单时间"],
    ZhCascaderLoadMore: ["下拉", "下拉选择", "远程搜索", "远程加载", "加载更多", "滚动加载", "分页加载"],
    ZhTable: ["表格", "列表", "数据表", "table", "列配置", "列排序", "合计行", "分页", "固定列", "多选"],
    ZhDiyDataTable: ["数据表格", "自定义表格", "列配置", "表尾合计", "分页", "排序"],
    ZhToolTips: ["提示", "tooltip", "悬浮提示", "气泡提示", "文字提示"],
    ZhDialog: ["弹窗", "对话框", "弹出层", "模态框", "dialog"],
    ZhMessageBox: ["确认弹窗", "提示弹窗", "二次确认", "messagebox"],
    ZhLoading: ["加载中", "loading", "遮罩", "骨架屏", "请求中"],
    ZhPageHeadPanel: ["页头", "页面头部", "页面头", "标题区", "操作区", "KPI", "统计卡片", "面包屑"],
    ZhDetailHeader: ["详情页头", "详情头部", "返回", "标题栏", "操作区"],
    ZhDetailSubTitle: ["副标题", "状态", "状态条", "摘要信息", "编号信息", "有效", "已取消"],
    ZhBaseInfo: ["基础信息", "信息容器", "详情信息", "栅格信息", "信息卡片"],
    ZhBaseItem: ["基础信息项", "字段展示", "label", "value", "键值对"],
    ZhGrid: ["栅格", "网格", "布局", "多列布局"],
    ZhInfoPair: ["信息对", "键值对", "label value", "字段展示", "快速展示", "复制字段"],
    ZhEditInfoPair: ["可编辑信息对", "编辑字段", "行内编辑", "保存取消"],
    ZhFileWrapper: ["文件", "附件", "文件包装", "文件预览", "下载", "上传", "文件列表", "封面图", "海报", "上传失败", "重新上传"],
    ZhVideoPlayer: ["视频", "播放器", "video", "mp4", "全屏", "进度条", "播放"],
    ZhMap: ["地图", "点位", "marker", "缩放", "定位"],
    ZhMoneyInput: ["金额", "金额输入", "货币", "小数", "大写金额", "预算金额", "商品价格", "售价", "原价", "成本价", "千分位"],
    ZhInputNumber: ["数字输入", "数值输入", "小数", "两位小数", "吨数", "步进", "报名人数", "人数上限", "限购数量", "课时数", "重量上限"]
  };

  for (const c of list) {
    const idLower = safeLower(c.id);
    const titleLower = safeLower(c.title);
    const aliasLower = (c.aliases || []).map((x) => safeLower(x));

    const synonymLines: string[] = [];
    const looksLikeInput =
      idLower.includes("input") ||
      titleLower.includes("input") ||
      aliasLower.some((a) => a === "input" || a.includes("input"));
    if (looksLikeInput) {
      synonymLines.push("同义词：输入、输入框、文本输入");
    }
    const manual = c.id && synonymById[c.id] ? synonymById[c.id] : undefined;
    if (manual?.length) {
      synonymLines.push(`同义词：${manual.join("、")}`);
    }

    const aliasText = Array.isArray(c.aliases) && c.aliases.length ? `别名：${c.aliases.join("、")}` : "";
    const keywords = keywordWords(keywordsForComponent(c.id, c.keywords));
    const keywordText = keywords.length ? `关键词：${keywords.slice(0, 20).join("、")}` : "";
    const extra = [aliasText, keywordText, ...synonymLines, c.searchText ? `SearchText：${c.searchText}` : ""]
      .filter(Boolean)
      .join("\n");

    toolCards.push({
      id: c.id,
      name: Array.isArray(c.aliases) && c.aliases.length ? c.aliases[0] : undefined,
      title: c.title,
      aliases: c.aliases,
      keywords: keywordsForComponent(c.id, c.keywords),
      scenarios: c.scenarios,
      capabilities: c.capabilities,
      searchText: c.searchText,
      searchTokens: c.searchTokens,
      summary: [c.description, extra].filter(Boolean).join("\n") || undefined,
      whenToUse: Array.isArray(c.scenarios) && c.scenarios.length ? `适用场景：${c.scenarios.join("、")}` : undefined,
      importHint: Array.isArray(c.files) && c.files.length ? `相关文件：${c.files.slice(0, 6).join(", ")}` : undefined,
      keyFiles: c.files
    });

    addSearchChunks(c, chunks);
  }

  return { toolCards, chunks };
}

function addSearchChunks(c: SearchComponent, chunks: Chunk[]): void {
  if (Array.isArray(c.props) && c.props.length) {
    const lines = c.props
      .slice(0, 40)
      .map((p) => `${p.name ?? ""} ${p.type ?? ""} ${p.default ? `(default: ${p.default})` : ""} ${p.description ?? ""}`.trim())
      .filter(Boolean);
    if (lines.length) {
      chunks.push({ id: `${c.id}::props`, component: c.id, type: "props", title: "Props", text: lines.join("\n") });
    }
  }

  if (Array.isArray(c.methods) && c.methods.length) {
    const lines = c.methods
      .slice(0, 40)
      .map((m) => `${m.name ?? ""} ${m.signature ?? ""} ${m.description ?? ""}`.trim())
      .filter(Boolean);
    if (lines.length) {
      chunks.push({ id: `${c.id}::methods`, component: c.id, type: "methods", title: "Methods", text: lines.join("\n") });
    }
  }

  if (Array.isArray(c.events) && c.events.length) {
    const lines = c.events
      .slice(0, 40)
      .map((e) => `${e.name ?? ""} ${e.description ?? ""}`.trim())
      .filter(Boolean);
    if (lines.length) {
      chunks.push({ id: `${c.id}::events`, component: c.id, type: "events", title: "Events", text: lines.join("\n") });
    }
  }

  if (Array.isArray(c.slots) && c.slots.length) {
    const lines = c.slots
      .slice(0, 40)
      .map((s) => `${s.name ?? ""} ${s.description ?? ""}`.trim())
      .filter(Boolean);
    if (lines.length) {
      chunks.push({ id: `${c.id}::slots`, component: c.id, type: "slots", title: "Slots", text: lines.join("\n") });
    }
  }

  if (Array.isArray(c.examples) && c.examples.length) {
    for (const ex of c.examples.slice(0, 20)) {
      const parts = [ex.title, ex.description, ex.path ? `path: ${ex.path}` : undefined].filter(Boolean);
      const text = parts.join("\n");
      if (!text) continue;
      chunks.push({
        id: `${c.id}::example::${safeLower(ex.title) || "untitled"}`,
        component: c.id,
        type: "example",
        title: ex.title,
        text
      });
    }
  }
}

function mergeDbs(a: KnowledgeDb, b: KnowledgeDb): KnowledgeDb {
  const cardById = new Map<string, ToolCard>();
  for (const c of a.toolCards) cardById.set(c.id, c);
  for (const c of b.toolCards) {
    if (!cardById.has(c.id)) cardById.set(c.id, c);
  }

  const chunkById = new Map<string, Chunk>();
  for (const ch of a.chunks) chunkById.set(ch.id, ch);
  for (const ch of b.chunks) {
    if (!chunkById.has(ch.id)) chunkById.set(ch.id, ch);
  }

  return { toolCards: Array.from(cardById.values()), chunks: Array.from(chunkById.values()) };
}

export function loadKnowledgeDb(): KnowledgeDb | null {
  if (cached) return cached;

  const mode = (env.componentKnowledgeMode || "legacy").toLowerCase();
  const legacy = loadLegacyDb();
  const searchDb = loadSearchJsonDb();

  if (mode === "search_json") {
    cached = searchDb;
    return cached.toolCards.length || cached.chunks.length ? cached : null;
  }

  if (mode === "hybrid") {
    const merged = mergeDbs(legacy, searchDb);
    cached = merged;
    return cached.toolCards.length || cached.chunks.length ? cached : null;
  }

  cached = legacy;
  return cached.toolCards.length || cached.chunks.length ? cached : null;
}
