import { describe, expect, it } from "vitest";
import {
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
});
