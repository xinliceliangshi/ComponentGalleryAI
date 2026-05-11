import { describe, expect, it } from "vitest";
import { buildDecompositionQueries, decomposeRequirement } from "../../requirement-decomposition.service.js";

describe("buildDecompositionQueries", () => {
  it("启用拆分时生成原需求和子任务查询", () => {
    const input = "做一个后台用户管理页面，包含筛选、表格、详情抽屉、编辑弹窗和分页";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries[0]).toBe(input);
    expect(queries.some((query) => query.includes("数据表格"))).toBe(true);
    expect(queries.some((query) => query.includes("详情抽屉"))).toBe(true);
  });

  it("首页拆分会生成面向 dashboard 模块的召回查询", () => {
    const input = "做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("核心指标概览"))).toBe(true);
    expect(queries.some((query) => query.includes("dashboard-trend"))).toBe(true);
    expect(queries.some((query) => query.includes("快捷入口"))).toBe(true);
  });

  it("详情页拆分会生成面向状态、基础信息和审核记录的召回查询", () => {
    const input = "做一个后台审核详情页，包含草稿、待审核状态、基础信息、内容详情、审核记录和操作日志";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("状态驱动 UI"))).toBe(true);
    expect(queries.some((query) => query.includes("基础信息区"))).toBe(true);
    expect(queries.some((query) => query.includes("审核记录"))).toBe(true);
    expect(queries.some((query) => query.includes("富文本"))).toBe(true);
  });

  it("详情页模块 DSL 会补充组件级召回查询", () => {
    const input = "做一个后台审核详情页，包含草稿、待审核状态、基础信息、内容详情、审核记录和操作日志";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("ZhDetailHeader"))).toBe(true);
    expect(queries.some((query) => query.includes("ZhDetailSubTitle"))).toBe(true);
    expect(queries.some((query) => query.includes("ZhButtonGroup"))).toBe(true);
    expect(queries.some((query) => query.includes("ZhBaseInfo"))).toBe(true);
    expect(queries.some((query) => query.includes("business-history-card"))).toBe(true);
    expect(queries.some((query) => query.includes("permission-aware-button-group"))).toBe(false);
  });

  it("新增页模块 DSL 会补充面向表单结构的召回查询", () => {
    const input = "做一个后台新增商品页面，包含基础信息、封面上传、必填校验和提交按钮";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("新增页头部"))).toBe(true);
    expect(queries.some((query) => query.includes("表单录入"))).toBe(true);
    expect(queries.some((query) => query.includes("表单校验"))).toBe(true);
    expect(queries.some((query) => query.includes("底部操作栏"))).toBe(true);
    expect(queries.some((query) => query.includes("upload-card"))).toBe(true);
  });

  it("复杂编辑页模块 DSL 会补充面向状态、预览和变更的召回查询", () => {
    const input = "做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("编辑页头部"))).toBe(true);
    expect(queries.some((query) => query.includes("状态横幅"))).toBe(true);
    expect(queries.some((query) => query.includes("实时预览"))).toBe(true);
    expect(queries.some((query) => query.includes("变更记录"))).toBe(true);
    expect(queries.some((query) => query.includes("sticky-footer-multi-actions"))).toBe(true);
  });

  it("普通管理页不会生成详情页模块组件查询", () => {
    const input = "做一个后台用户管理页面，包含筛选、表格、详情抽屉、编辑弹窗和分页";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(result.sections).toBeUndefined();
    expect(queries.some((query) => query.includes("ZhDetailHeader"))).toBe(false);
    expect(queries.some((query) => query.includes("business-history-card"))).toBe(false);
  });
});
