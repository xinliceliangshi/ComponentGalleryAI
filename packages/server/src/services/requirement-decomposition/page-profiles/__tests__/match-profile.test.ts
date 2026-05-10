import { describe, expect, it } from "vitest";
import { matchRequirementPageProfile } from "../index.js";

describe("matchRequirementPageProfile", () => {
  it("后台首页工作台文案命中 admin-home-dashboard", () => {
    expect(
      matchRequirementPageProfile("做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口").pageType
    ).toBe("admin-home-dashboard");
  });

  it("后台审核详情命中 admin-detail", () => {
    expect(
      matchRequirementPageProfile(
        "做一个后台审核详情页，顶部展示标题、状态Tag和操作按钮，包含基础信息、审核记录"
      ).pageType
    ).toBe("admin-detail");
  });

  it("含列表表格的管理页命中 admin-management", () => {
    expect(
      matchRequirementPageProfile("做一个后台用户管理页面，包含筛选、表格、批量操作和分页").pageType
    ).toBe("admin-management");
  });

  it("含详情抽屉的管理列表仍命中 admin-management", () => {
    expect(
      matchRequirementPageProfile("做一个后台详情页列表，包含筛选、表格、详情抽屉和分页").pageType
    ).toBe("admin-management");
  });

  it("复杂编辑信号命中 admin-edit", () => {
    expect(
      matchRequirementPageProfile(
        "做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览"
      ).pageType
    ).toBe("admin-edit");
  });

  it("后台新增表单命中 admin-create", () => {
    expect(
      matchRequirementPageProfile("做一个后台新增商品页面，包含基础信息、封面上传和提交").pageType
    ).toBe("admin-create");
  });

  it("无后台上下文的统计看板命中 dashboard", () => {
    expect(matchRequirementPageProfile("做一个销售统计看板，包含指标、趋势图表和区域排行").pageType).toBe("dashboard");
  });

  it("通用表单页命中 form-page", () => {
    expect(matchRequirementPageProfile("做一个请假申请表单，包含填写信息、提交和校验").pageType).toBe("form-page");
  });
});
