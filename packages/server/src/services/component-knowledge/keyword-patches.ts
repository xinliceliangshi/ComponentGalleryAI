import type { KeywordInput, WeightedKeyword } from "./types.js";

export const KEYWORD_PATCHES_BY_ID: Record<string, WeightedKeyword[]> = {
  ZhTable: [
    { word: "表格", weight: 3.2, category: "component" },
    { word: "table", weight: 3, category: "component" },
    { word: "列表", weight: 2.8, category: "component" },
    { word: "待办事项", weight: 2.7, category: "scenario" },
    { word: "最近动态", weight: 2.6, category: "scenario" },
    { word: "动态列表", weight: 2.6, category: "scenario" },
    { word: "待办列表", weight: 2.6, category: "scenario" },
    { word: "数据表", weight: 2.5, category: "component" },
    { word: "分页", weight: 2.4, category: "feature" },
    { word: "列配置", weight: 2.3, category: "feature" },
    { word: "排序", weight: 2.2, category: "feature" },
    { word: "合计行", weight: 2.2, category: "feature" },
    { word: "固定列", weight: 1.8, category: "feature" },
    { word: "多选", weight: 1.7, category: "feature" },
    { word: "状态列", weight: 1.6, category: "feature" },
    { word: "链接列", weight: 1.5, category: "feature" }
  ],
  ZhDiyDataTable: [
    { word: "自定义表格", weight: 3.2, category: "component" },
    { word: "数据表格", weight: 3, category: "component" },
    { word: "table", weight: 2.7, category: "component" },
    { word: "列配置", weight: 2.5, category: "feature" },
    { word: "表尾合计", weight: 2.4, category: "feature" },
    { word: "合计行", weight: 2.2, category: "feature" },
    { word: "分页", weight: 2.2, category: "feature" },
    { word: "排序", weight: 2, category: "feature" },
    { word: "格式化", weight: 1.5, category: "feature" }
  ],
  ZhDatePicker: [
    { word: "日期", weight: 3, category: "component" },
    { word: "日期范围", weight: 3, category: "feature" },
    { word: "时间范围", weight: 2.5, category: "feature" },
    { word: "下单时间", weight: 2.2, category: "scenario" },
    { word: "起止时间", weight: 2, category: "scenario" },
    { word: "筛选日期", weight: 1.8, category: "scenario" }
  ],
  ZhInput: [
    { word: "输入框", weight: 3, category: "component" },
    { word: "输入", weight: 2.8, category: "component" },
    { word: "搜索框", weight: 2.6, category: "component" },
    { word: "表单", weight: 2.6, category: "scenario" },
    { word: "表单校验", weight: 2.8, category: "feature" },
    { word: "字段", weight: 2.4, category: "prop" },
    { word: "校验失败", weight: 2.3, category: "scenario" },
    { word: "错误提示", weight: 2.1, category: "visual" },
    { word: "编号", weight: 2, category: "scenario" },
    { word: "合同", weight: 1.8, category: "scenario" },
    { word: "模糊查询", weight: 2.4, category: "feature" },
    { word: "关键字", weight: 2, category: "feature" }
  ],
  ZhButton: [
    { word: "按钮", weight: 3, category: "component" },
    { word: "操作按钮", weight: 2.8, category: "component" },
    { word: "状态按钮", weight: 2.6, category: "scenario" },
    { word: "审核按钮", weight: 2.6, category: "scenario" },
    { word: "快捷入口", weight: 3, category: "scenario" },
    { word: "快捷操作", weight: 2.8, category: "scenario" },
    { word: "入口", weight: 2.4, category: "scenario" },
    { word: "新建", weight: 2.5, category: "action" },
    { word: "导出", weight: 2.3, category: "action" },
    { word: "系统配置", weight: 2.1, category: "scenario" },
    { word: "查询", weight: 2.8, category: "action" },
    { word: "搜索", weight: 2.6, category: "action" },
    { word: "重置", weight: 2.4, category: "action" },
    { word: "清除", weight: 2, category: "action" },
    { word: "主按钮", weight: 1.8, category: "visual" },
    { word: "搜索图标", weight: 1.6, category: "visual" }
  ],
  ZhButtonGroup: [
    { word: "按钮组", weight: 3, category: "component" },
    { word: "操作按钮区", weight: 3.2, category: "layout" },
    { word: "详情页操作区", weight: 3.1, category: "scenario" },
    { word: "状态操作", weight: 2.8, category: "scenario" },
    { word: "权限按钮", weight: 2.8, category: "scenario" },
    { word: "快捷入口", weight: 3.2, category: "scenario" },
    { word: "快捷操作", weight: 3, category: "scenario" },
    { word: "操作入口", weight: 2.8, category: "scenario" },
    { word: "常用操作", weight: 2.6, category: "scenario" },
    { word: "入口", weight: 2.4, category: "scenario" },
    { word: "新建", weight: 2.4, category: "action" },
    { word: "导出", weight: 2.2, category: "action" },
    { word: "操作区", weight: 2.2, category: "layout" },
    { word: "查询重置", weight: 2.4, category: "scenario" },
    { word: "批量操作", weight: 1.8, category: "scenario" }
  ],
  ZhCascaderLoadMore: [
    { word: "下拉", weight: 2.8, category: "component" },
    { word: "状态下拉", weight: 2.7, category: "scenario" },
    { word: "专区名称", weight: 2.4, category: "scenario" },
    { word: "远程搜索", weight: 2.2, category: "feature" },
    { word: "加载更多", weight: 2, category: "feature" },
    { word: "分页加载", weight: 1.8, category: "feature" }
  ],
  ZhPageHeadPanel: [
    { word: "页头", weight: 3, category: "component" },
    { word: "顶部", weight: 2, category: "layout" },
    { word: "KPI", weight: 3, category: "scenario" },
    { word: "统计卡片", weight: 3, category: "scenario" },
    { word: "关键指标", weight: 2.7, category: "scenario" },
    { word: "指标卡", weight: 2.6, category: "component" },
    { word: "标题区", weight: 2, category: "layout" }
  ],
  ZhBaseInfo: [
    { word: "基础信息", weight: 3, category: "component" },
    { word: "详情信息", weight: 2.8, category: "scenario" },
    { word: "详情页基础信息", weight: 3.2, category: "scenario" },
    { word: "审核记录", weight: 2.8, category: "scenario" },
    { word: "审批记录", weight: 2.8, category: "scenario" },
    { word: "业务历史", weight: 2.5, category: "scenario" },
    { word: "操作日志", weight: 2.4, category: "scenario" },
    { word: "时间线", weight: 2.2, category: "scenario" },
    { word: "信息卡片", weight: 2.4, category: "component" },
    { word: "详情卡片", weight: 2.5, category: "component" },
    { word: "记录卡片", weight: 2.3, category: "component" },
    { word: "统计卡片", weight: 2, category: "scenario" },
    { word: "栅格展示", weight: 2.2, category: "layout" },
    { word: "键值对", weight: 1.8, category: "component" }
  ],
  ZhGrid: [
    { word: "栅格", weight: 3, category: "component" },
    { word: "网格", weight: 2.6, category: "layout" },
    { word: "多列布局", weight: 2.7, category: "layout" },
    { word: "左右两栏", weight: 3, category: "layout" },
    { word: "双栏", weight: 2.8, category: "layout" },
    { word: "两栏展示", weight: 2.8, category: "layout" },
    { word: "两列", weight: 2, category: "layout" },
    { word: "布局", weight: 2, category: "layout" }
  ],
  ZhInfoPair: [
    { word: "信息对", weight: 3.2, category: "component" },
    { word: "详情字段", weight: 2.8, category: "scenario" },
    { word: "基础字段", weight: 2.6, category: "scenario" },
    { word: "只读", weight: 2.6, category: "scenario" },
    { word: "只读模式", weight: 2.8, category: "scenario" },
    { word: "字段展示", weight: 2.4, category: "feature" },
    { word: "键值对", weight: 2.4, category: "component" },
    { word: "label value", weight: 2, category: "component" },
    { word: "展示", weight: 1.8, category: "scenario" }
  ],
  ZhEditInfoPair: [
    { word: "可编辑信息对", weight: 3.2, category: "component" },
    { word: "编辑模式", weight: 3, category: "scenario" },
    { word: "编辑字段", weight: 2.7, category: "feature" },
    { word: "行内编辑", weight: 2.6, category: "feature" },
    { word: "保存", weight: 2.2, category: "action" },
    { word: "取消", weight: 2, category: "action" },
    { word: "切换", weight: 1.8, category: "action" }
  ],
  ZhFileWrapper: [
    { word: "文件", weight: 3, category: "component" },
    { word: "附件", weight: 3.2, category: "component" },
    { word: "附件区", weight: 3, category: "scenario" },
    { word: "上传区", weight: 2.9, category: "scenario" },
    { word: "新增页附件", weight: 2.8, category: "scenario" },
    { word: "素材上传", weight: 2.8, category: "scenario" },
    { word: "封面图", weight: 2.7, category: "scenario" },
    { word: "海报", weight: 2.6, category: "scenario" },
    { word: "重新上传", weight: 2.5, category: "action" },
    { word: "上传失败", weight: 2.4, category: "scenario" },
    { word: "上传", weight: 2.7, category: "action" },
    { word: "预览", weight: 2.7, category: "action" },
    { word: "下载", weight: 2.7, category: "action" },
    { word: "删除", weight: 2.5, category: "action" },
    { word: "文件名", weight: 2.2, category: "feature" },
    { word: "完整路径", weight: 2, category: "feature" }
  ],
  ZhToolTips: [
    { word: "tooltip", weight: 3, category: "component" },
    { word: "提示", weight: 3, category: "component" },
    { word: "悬浮提示", weight: 2.8, category: "visual" },
    { word: "气泡提示", weight: 2.6, category: "visual" },
    { word: "省略", weight: 2.5, category: "feature" },
    { word: "完整路径", weight: 2.2, category: "feature" },
    { word: "过长", weight: 1.8, category: "visual" }
  ],
  ZhDialog: [
    { word: "弹窗", weight: 3, category: "component" },
    { word: "对话框", weight: 3, category: "component" },
    { word: "弹窗表单", weight: 3.2, category: "scenario" },
    { word: "表单弹窗", weight: 3, category: "scenario" },
    { word: "模态框", weight: 2.5, category: "component" },
    { word: "确认", weight: 1.8, category: "action" }
  ],
  ZhMessageBox: [
    { word: "确认弹窗", weight: 3.2, category: "component" },
    { word: "提示弹窗", weight: 2.8, category: "component" },
    { word: "二次确认", weight: 3, category: "scenario" },
    { word: "删除前确认", weight: 2.8, category: "scenario" },
    { word: "保存前", weight: 2.5, category: "scenario" },
    { word: "未保存确认", weight: 2.8, category: "scenario" },
    { word: "确认", weight: 2.2, category: "action" }
  ],
  ZhDetailSubTitle: [
    { word: "副标题", weight: 3.4, category: "component" },
    { word: "详情页副标题", weight: 3.3, category: "scenario" },
    { word: "状态副标题", weight: 3.2, category: "scenario" },
    { word: "状态驱动", weight: 3.1, category: "scenario" },
    { word: "状态Tag", weight: 3, category: "visual" },
    { word: "状态标签", weight: 3, category: "visual" },
    { word: "当前状态", weight: 2.8, category: "visual" },
    { word: "业务状态", weight: 2.7, category: "visual" },
    { word: "审核状态", weight: 2.7, category: "visual" },
    { word: "审批状态", weight: 2.7, category: "visual" },
    { word: "流程节点", weight: 2.5, category: "scenario" },
    { word: "时间线节点", weight: 2.4, category: "scenario" },
    { word: "副标题区", weight: 3, category: "layout" },
    { word: "状态条", weight: 2.8, category: "component" },
    { word: "编号信息", weight: 2.5, category: "scenario" },
    { word: "状态", weight: 2.4, category: "visual" },
    { word: "有效", weight: 2, category: "visual" },
    { word: "已取消", weight: 2, category: "visual" },
    { word: "颜色区分", weight: 1.8, category: "visual" }
  ],
  ZhDetailHeader: [
    { word: "详情页头部", weight: 3.6, category: "component" },
    { word: "详情头部", weight: 3.5, category: "component" },
    { word: "详情页头", weight: 3.4, category: "component" },
    { word: "Header", weight: 3, category: "component" },
    { word: "标题栏", weight: 3, category: "layout" },
    { word: "返回按钮", weight: 2.8, category: "action" },
    { word: "标题状态操作区", weight: 2.8, category: "layout" },
    { word: "头部操作区", weight: 2.7, category: "layout" },
    { word: "详情页操作区", weight: 2.6, category: "scenario" },
    { word: "状态Tag", weight: 2.3, category: "visual" },
    { word: "状态标签", weight: 2.3, category: "visual" }
  ],
  ZhVideoPlayer: [
    { word: "视频播放器", weight: 3.5, category: "component" },
    { word: "视频", weight: 3.2, category: "component" },
    { word: "播放器", weight: 3.2, category: "component" },
    { word: "video", weight: 3, category: "component" },
    { word: "mp4", weight: 3, category: "scenario" },
    { word: "播放", weight: 2.8, category: "action" },
    { word: "播放地址", weight: 2.6, category: "prop" },
    { word: "全屏", weight: 2.4, category: "feature" },
    { word: "进度条", weight: 2.4, category: "feature" },
    { word: "播放失败", weight: 2.2, category: "scenario" },
    { word: "占位提示", weight: 2, category: "visual" }
  ],
  ZhMap: [
    { word: "地图", weight: 3.4, category: "component" },
    { word: "地图模块", weight: 3.3, category: "scenario" },
    { word: "点位", weight: 3, category: "scenario" },
    { word: "marker", weight: 3, category: "component" },
    { word: "缩放", weight: 2.8, category: "feature" },
    { word: "定位", weight: 2.7, category: "feature" },
    { word: "行政区", weight: 2.4, category: "scenario" },
    { word: "弹出信息", weight: 2.3, category: "feature" }
  ],
  ZhLoading: [
    { word: "加载", weight: 3, category: "visual" },
    { word: "loading", weight: 3, category: "visual" },
    { word: "遮罩", weight: 2.3, category: "visual" },
    { word: "请求中", weight: 2, category: "scenario" }
  ],
  ZhMoneyInput: [
    { word: "金额", weight: 3.4, category: "component" },
    { word: "金额输入", weight: 3.3, category: "component" },
    { word: "预算金额", weight: 3.2, category: "scenario" },
    { word: "商品价格", weight: 3.1, category: "scenario" },
    { word: "售价", weight: 3, category: "scenario" },
    { word: "原价", weight: 2.9, category: "scenario" },
    { word: "成本价", weight: 2.8, category: "scenario" },
    { word: "自动格式化千分位", weight: 2.8, category: "feature" },
    { word: "千分位", weight: 2.8, category: "feature" },
    { word: "大于零", weight: 2.6, category: "scenario" },
    { word: "价格校验", weight: 2.5, category: "scenario" },
    { word: "货币", weight: 2.4, category: "component" },
    { word: "大写金额", weight: 2.3, category: "feature" }
  ],
  ZhInputNumber: [
    { word: "数字输入", weight: 3.3, category: "component" },
    { word: "数值输入", weight: 3.1, category: "component" },
    { word: "报名人数", weight: 3, category: "scenario" },
    { word: "人数上限", weight: 3, category: "scenario" },
    { word: "限购数量", weight: 3, category: "scenario" },
    { word: "课时数", weight: 2.9, category: "scenario" },
    { word: "排序值", weight: 2.8, category: "scenario" },
    { word: "权重分数", weight: 2.8, category: "scenario" },
    { word: "重量上限", weight: 2.8, category: "scenario" },
    { word: "库存", weight: 2.6, category: "scenario" },
    { word: "步进调整", weight: 2.6, category: "feature" },
    { word: "步进", weight: 2.5, category: "feature" },
    { word: "两位小数", weight: 2.4, category: "feature" },
    { word: "小数", weight: 2.2, category: "feature" }
  ]
};

export function normalizeWeightedKeywords(values: KeywordInput[] | undefined): WeightedKeyword[] {
  if (!values?.length) return [];

  const out: WeightedKeyword[] = [];
  for (const value of values) {
    if (typeof value === "string") {
      const word = value.trim();
      if (word) out.push({ word, weight: 1 });
      continue;
    }

    const word = value.word?.trim();
    const weight = Number(value.weight);
    if (!word) continue;
    out.push({
      word,
      weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
      category: value.category
    });
  }

  return out;
}

export function keywordWords(values: KeywordInput[] | undefined): string[] {
  return normalizeWeightedKeywords(values).map((item) => item.word);
}

export function keywordsForComponent(id: string | undefined, keywords: KeywordInput[] | undefined): KeywordInput[] {
  return [...(keywords ?? []), ...(id ? KEYWORD_PATCHES_BY_ID[id] ?? [] : [])];
}
