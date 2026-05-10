import { includesAny } from "../matchers.js";

export const ADMIN_CONTEXT_TERMS = ["后台", "管理", "管理系统", "运营", "控制台"];
export const CREATE_PAGE_TERMS = ["新增", "新建", "创建", "录入"];
export const EDIT_INTENT_TERMS = ["编辑", "修改", "维护", "配置", "调整", "更新"];
export const LIST_PAGE_TERMS = ["列表", "表格", "分页", "筛选", "查询", "搜索", "批量"];
export const DETAIL_PAGE_TERMS = ["详情页", "审核详情", "审批详情"];

const STATUS_TERMS = ["状态", "发布", "下线", "审核", "审批", "流转", "草稿", "生效", "锁定"];
const PERMISSION_TERMS = ["权限", "角色", "只读", "禁用", "可编辑", "不可编辑"];
const HISTORY_TERMS = ["变更记录", "操作日志", "版本记录", "修改历史", "差异", "对比"];
const STRUCTURE_TERMS = ["预览", "关联数据", "子项", "明细配置", "局部保存", "侧边面板", "联动"];

export function countMatchedComplexGroups(text: string): number {
  let count = 0;

  if (includesAny(text, STATUS_TERMS)) count += 1;
  if (includesAny(text, PERMISSION_TERMS)) count += 1;
  if (includesAny(text, HISTORY_TERMS)) count += 1;
  if (includesAny(text, STRUCTURE_TERMS)) count += 1;

  return count;
}
