import { describe, expect, it } from "vitest";
import { buildDecompositionQueries, decomposeRequirement } from "./requirement-decomposition.service.js";

describe("decomposeRequirement", () => {
  it("短小单意图需求不启用拆分", () => {
    const result = decomposeRequirement("做一个登录按钮");

    expect(result.enabled).toBe(false);
    expect(result.subtasks).toHaveLength(0);
  });

  it("大型后台需求启用拆分并识别关键子任务", () => {
    const result = decomposeRequirement(
      "做一个后台用户管理页面，包含筛选、表格、批量操作、详情抽屉、编辑弹窗、权限状态和分页"
    );

    expect(result.enabled).toBe(true);
    expect(result.pageType).toBe("admin-management");
    expect(result.subtasks.map((task) => task.id)).toEqual(
      expect.arrayContaining(["filter", "table", "batch-actions", "detail-drawer", "edit-dialog", "pagination"])
    );
    expect(result.constraints).toContain("必须覆盖所有 must 子任务");
  });
});

describe("buildDecompositionQueries", () => {
  it("启用拆分时生成原需求和子任务查询", () => {
    const input = "做一个后台用户管理页面，包含筛选、表格、详情抽屉、编辑弹窗和分页";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries[0]).toBe(input);
    expect(queries.some((query) => query.includes("数据表格"))).toBe(true);
    expect(queries.some((query) => query.includes("详情抽屉"))).toBe(true);
  });
});
