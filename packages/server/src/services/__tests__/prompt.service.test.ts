import { describe, expect, it } from "vitest";
import { buildPrompt } from "../prompt.service.js";
import {
  retrieveKnowledgeForDecomposition,
  retrieveKnowledgeForSections
} from "../component-knowledge.service.js";
import { buildGenerationPlan } from "../generation-plan.service.js";
import { decomposeRequirement } from "../requirement-decomposition.service.js";

describe("buildPrompt", () => {
  it("复杂编辑页会注入 admin-edit 专项要求", () => {
    const input = "做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition);
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition);
    const generationPlan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });
    const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-edit");
    expect(prompt).toContain("【GenerationPlan】");
    expect(prompt).toContain("后台复杂编辑页专项要求：");
    expect(prompt).toContain("复杂编辑页不能等同于新增页回填，必须体现当前状态和编辑上下文");
    expect(prompt).toContain("页面主体允许表单、只读信息、关联配置、预览区混合布局");
    expect(prompt).toContain("页面类型：admin-edit");
    expect(prompt).toContain("区块计划：");
    expect(prompt).toContain("页面头部 [page-header] / header-title-status-actions");
    expect(prompt).toContain("底部操作区 [action-footer] / sticky-footer-multi-actions");
    expect(prompt).toContain("ZhButtonGroup(high):");
    expect(prompt).toContain("snippets:");
  });

  it("详情页会强调 workflow 驱动细节推理，sections 只保留稳定骨架", () => {
    const input = "做一个后台审核详情页，包含草稿、待审核状态Tag、基础信息、内容详情、审核记录和操作日志";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition);
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition);
    const generationPlan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });
    const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-detail");
    expect(prompt).toContain("详情页先按 workflow 推理状态、权限、按钮和内容取舍");
    expect(prompt).toContain("页面头部 [page-header] / header-title-status-actions");
    expect(prompt).toContain("基础信息区 [base-info] / descriptions-grid");
    expect(prompt).toContain("“待审核 / 已通过 / 已拒绝”等状态必须设计为可配置项");
    expect(prompt).toContain("当前状态优先从 workflow.initialState 推理");
    expect(prompt).toContain("deriveWorkflowActions(workflow, currentStatus, permissions)");
    expect(prompt).toContain("const currentStatus = detail.workflow?.current ?? detail.workflow?.initialState ?? detail.status；const actions = deriveWorkflowActions");
    expect(prompt).toContain("action 元信息（用于从 workflow 派生按钮区）");
    expect(prompt).not.toContain("状态横幅 [status-banner]");
    expect(prompt).not.toContain("状态操作区 [status-actions]");
  });

  it("轻编辑复用新增页时仍注入 admin-create 专项要求", () => {
    const input = "做一个后台编辑商品页面，包含基础信息、封面上传和保存按钮";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition);
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition);
    const generationPlan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });
    const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-create");
    expect(prompt).toContain("后台新增页专项要求：");
    expect(prompt).not.toContain("后台复杂编辑页专项要求：");
    expect(prompt).toContain("页面类型：admin-create");
    expect(prompt).toContain("页面头部 [page-header] / header-title-back-actions");
    expect(prompt).toContain("底部操作区 [action-footer] / sticky-footer-actions");
  });

  it("发布配置类复杂编辑页会持续注入 admin-edit 约束", () => {
    const input = "做一个后台发布配置页面，包含草稿状态、发布流程、版本记录和实时预览";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition);
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition);
    const generationPlan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });
    const prompt = buildPrompt(input, { decomposition, generationPlan, knowledge: "" });

    expect(decomposition.pageType).toBe("admin-edit");
    expect(prompt).toContain("后台复杂编辑页专项要求：");
    expect(prompt).toContain("若涉及发布流或审核流，操作按钮必须根据状态和权限动态变化");
    expect(prompt).toContain("状态横幅 [status-banner] / status-context-banner");
    expect(prompt).toContain("预览区 [preview-panel] / side-preview-panel");
    expect(prompt).toContain("历史记录区 [history-panel] / history-timeline-card");
  });
});
