import { describe, expect, it } from "vitest";
import { buildPrompt } from "../prompt.service.js";
import { decomposeRequirement } from "../requirement-decomposition.service.js";

describe("buildPrompt", () => {
  it("复杂编辑页会注入 admin-edit 专项要求", () => {
    const input = "做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览";
    const decomposition = decomposeRequirement(input);
    const prompt = buildPrompt(input, { decomposition, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-edit");
    expect(prompt).toContain("后台复杂编辑页专项要求：");
    expect(prompt).toContain("复杂编辑页不能等同于新增页回填，必须体现当前状态和编辑上下文");
    expect(prompt).toContain("页面主体允许表单、只读信息、关联配置、预览区混合布局");
    expect(prompt).toContain("\"pageType\": \"admin-edit\"");
    expect(prompt).toContain("\"type\": \"editHeader\"");
    expect(prompt).toContain("\"type\": \"editActionBar\"");
  });

  it("轻编辑复用新增页时仍注入 admin-create 专项要求", () => {
    const input = "做一个后台编辑商品页面，包含基础信息、封面上传和保存按钮";
    const decomposition = decomposeRequirement(input);
    const prompt = buildPrompt(input, { decomposition, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-create");
    expect(prompt).toContain("后台新增页专项要求：");
    expect(prompt).not.toContain("后台复杂编辑页专项要求：");
    expect(prompt).toContain("\"pageType\": \"admin-create\"");
    expect(prompt).toContain("\"type\": \"createHeader\"");
    expect(prompt).toContain("\"type\": \"submitBar\"");
  });

  it("发布配置类复杂编辑页会持续注入 admin-edit 约束", () => {
    const input = "做一个后台发布配置页面，包含草稿状态、发布流程、版本记录和实时预览";
    const decomposition = decomposeRequirement(input);
    const prompt = buildPrompt(input, { decomposition, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-edit");
    expect(prompt).toContain("后台复杂编辑页专项要求：");
    expect(prompt).toContain("若涉及发布流或审核流，操作按钮必须根据状态和权限动态变化");
    expect(prompt).toContain("\"type\": \"statusBanner\"");
    expect(prompt).toContain("\"type\": \"previewPanel\"");
    expect(prompt).toContain("\"type\": \"changeHistory\"");
  });
});
