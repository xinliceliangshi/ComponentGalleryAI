import { describe, expect, it } from "vitest";
import {
  retrieveKnowledgeForSection,
  retrieveKnowledgeForSections,
  retrieveKnowledgeForDecomposition,
  retrieveKnowledgeForQuery
} from "../component-knowledge.service.js";
import { decomposeRequirement } from "../requirement-decomposition.service.js";

describe("component knowledge retrieval", () => {
  it("单意图表格需求可以召回表格组件", () => {
    const result = retrieveKnowledgeForQuery("做一个表格列表，支持分页和列配置");
    const cardIds = result.cards.map((card) => card.id);
    const chunkComponentIds = result.chunks.map((chunk) => chunk.component).filter(Boolean);

    expect([...cardIds, ...chunkComponentIds]).toEqual(
      expect.arrayContaining(["ZhTable"])
    );
  });

  it("后台首页拆分后优先召回概览类组件，而不是只召回表格", () => {
    const input = "做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口";
    const decomposition = decomposeRequirement(input);
    const result = retrieveKnowledgeForDecomposition(input, decomposition, {
      maxCards: 12,
      maxChunks: 8
    });
    const cardIds = result.cards.map((card) => card.id);

    expect(decomposition.pageType).toBe("admin-home-dashboard");
    expect(cardIds).toEqual(expect.arrayContaining(["ZhPageHeadPanel", "ZhBaseInfo"]));
    expect(cardIds.slice(0, 4)).not.toEqual(["ZhTable", "ZhDiyDataTable"]);
  });

  it("详情页头部和状态关键词可以召回详情组件", () => {
    const result = retrieveKnowledgeForQuery("后台审核详情页头部：标题、状态Tag、返回按钮和操作按钮区");
    const cardIds = result.cards.map((card) => card.id);
    const chunkComponentIds = result.chunks.map((chunk) => chunk.component).filter(Boolean);

    expect([...cardIds, ...chunkComponentIds]).toEqual(
      expect.arrayContaining(["ZhDetailHeader", "ZhDetailSubTitle"])
    );
  });

  it("后台详情页拆分后优先召回详情页结构组件", () => {
    const input = "做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志";
    const decomposition = decomposeRequirement(input);
    const result = retrieveKnowledgeForDecomposition(input, decomposition, {
      maxCards: 12,
      maxChunks: 8
    });
    const cardIds = result.cards.map((card) => card.id);

    expect(decomposition.pageType).toBe("admin-detail");
    expect(cardIds).toEqual(
      expect.arrayContaining(["ZhDetailHeader", "ZhDetailSubTitle", "ZhBaseInfo"])
    );
    expect(cardIds.slice(0, 5)).not.toEqual(["ZhTable", "ZhDiyDataTable"]);
  });

  it("新增页数量语义可以召回数字输入组件", () => {
    const result = retrieveKnowledgeForQuery("后台创建活动页：报名人数上限字段和每人限购数量字段并排展示");
    const cardIds = result.cards.map((card) => card.id);
    const chunkComponentIds = result.chunks.map((chunk) => chunk.component).filter(Boolean);

    expect([...cardIds, ...chunkComponentIds]).toEqual(
      expect.arrayContaining(["ZhInputNumber"])
    );
  });

  it("新增页金额语义可以召回金额输入组件", () => {
    const result = retrieveKnowledgeForQuery("新增页金额字段：预算金额输入时自动格式化千分位");
    const cardIds = result.cards.map((card) => card.id);
    const chunkComponentIds = result.chunks.map((chunk) => chunk.component).filter(Boolean);

    expect([...cardIds, ...chunkComponentIds]).toEqual(
      expect.arrayContaining(["ZhMoneyInput"])
    );
  });

  it("新增页上传失败语义可以召回文件组件", () => {
    const result = retrieveKnowledgeForQuery("新增活动页：海报上传失败时展示错误提示并支持重新上传");
    const cardIds = result.cards.map((card) => card.id);
    const chunkComponentIds = result.chunks.map((chunk) => chunk.component).filter(Boolean);

    expect([...cardIds, ...chunkComponentIds]).toEqual(
      expect.arrayContaining(["ZhFileWrapper", "ZhButton"])
    );
  });

  it("section-aware recall 会为页面头部召回头部类组件", () => {
    const decomposition = decomposeRequirement("做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志");
    const headerSection = decomposition.sections?.find((section) => section.kind === "page-header");

    expect(headerSection).toBeDefined();
    const result = retrieveKnowledgeForSection(headerSection!, {
      maxCards: 8,
      maxChunks: 6
    });
    const cardIds = result.cards.map((card) => card.id);

    expect(cardIds).toEqual(expect.arrayContaining(["ZhDetailHeader"]));
  });

  it("section-aware recall 会为多个区块分别返回候选组件池", () => {
    const decomposition = decomposeRequirement("做一个后台新增商品页面，包含基础信息、封面上传、必填校验和提交按钮");
    const result = retrieveKnowledgeForSections(decomposition, {
      maxCardsPerSection: 6,
      maxChunksPerSection: 4
    });

    const sectionKinds = result.map((entry) => entry.section.kind);
    expect(sectionKinds).toEqual(expect.arrayContaining(["page-header", "form-body", "upload-panel"]));

    const uploadKnowledge = result.find((entry) => entry.section.kind === "upload-panel");
    expect(uploadKnowledge?.cards.map((card) => card.id)).toEqual(
      expect.arrayContaining(["ZhFileWrapper"])
    );
  });
});
