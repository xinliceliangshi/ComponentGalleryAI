import { describe, expect, it } from "vitest";
import {
  retrieveKnowledgeForDecomposition,
  retrieveKnowledgeForSections
} from "../component-knowledge.service.js";
import { buildGenerationPlan } from "../generation-plan.service.js";
import { decomposeRequirement } from "../requirement-decomposition.service.js";

describe("buildGenerationPlan", () => {
  it("为新增页生成可读的区块计划和推荐组件", () => {
    const input = "做一个后台新增商品页面，包含基础信息、封面上传、必填校验和提交按钮";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition);
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition);
    const plan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });

    expect(plan?.pageType).toBe("admin-create");
    expect(plan?.sections.map((section) => section.kind)).toEqual(
      expect.arrayContaining(["page-header", "form-body", "upload-panel", "action-footer"])
    );
    expect(plan?.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "form-body",
          title: "主表单区",
          referenceSnippets: expect.any(Array)
        }),
        expect.objectContaining({
          kind: "action-footer",
          recommendedComponents: expect.arrayContaining([
            expect.objectContaining({ name: "ZhButtonGroup", usage: expect.any(String) }),
            expect.objectContaining({ name: "ZhButton", usage: expect.any(String) })
          ])
        })
      ])
    );
  });

  it("为详情页保留结构目标并推荐详情类组件", () => {
    const input = "做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition, {
      maxCards: 12,
      maxChunks: 8
    });
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition, {
      maxCardsPerSection: 8,
      maxChunksPerSection: 6
    });
    const plan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });

    expect(plan?.pageType).toBe("admin-detail");
    expect(plan?.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "page-header",
          recommendedComponents: expect.arrayContaining([
            expect.objectContaining({ name: "ZhDetailHeader" })
          ])
        }),
        expect.objectContaining({
          kind: "base-info",
          recommendedComponents: expect.arrayContaining([
            expect.objectContaining({ name: "ZhBaseInfo" })
          ])
        })
      ])
    );
  });

  it("优先使用 section-aware recall 命中的组件作为区块推荐", () => {
    const input = "做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition, {
      maxCards: 12,
      maxChunks: 8
    });
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition, {
      maxCardsPerSection: 8,
      maxChunksPerSection: 6
    });
    const plan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });

    const headerSection = plan?.sections.find((section) => section.kind === "page-header");
    expect(headerSection?.recommendedComponents).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "ZhDetailHeader", usage: expect.any(String) })])
    );
  });

  it("会为区块附带参考片段摘要，帮助后续 prompt 落代码", () => {
    const input = "做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志";
    const decomposition = decomposeRequirement(input);
    const knowledgeResult = retrieveKnowledgeForDecomposition(input, decomposition, {
      maxCards: 12,
      maxChunks: 8
    });
    const sectionKnowledge = retrieveKnowledgeForSections(decomposition, {
      maxCardsPerSection: 8,
      maxChunksPerSection: 6
    });
    const plan = buildGenerationPlan(decomposition, { ...knowledgeResult, sectionKnowledge });

    const baseInfoSection = plan?.sections.find((section) => section.kind === "base-info");
    expect(baseInfoSection?.referenceSnippets.length).toBeGreaterThan(0);
    expect(baseInfoSection?.referenceSnippets[0]).toEqual(
      expect.objectContaining({
        summary: expect.any(String)
      })
    );
  });
});
