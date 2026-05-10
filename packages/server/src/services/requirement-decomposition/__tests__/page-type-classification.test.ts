import { describe, expect, it } from "vitest";
import { decomposeRequirement } from "../../requirement-decomposition.service.js";
import { pageTypeCases } from "./fixtures/page-type-cases.js";

describe("page type classification", () => {
  it("页面类型样例数量保持为 210 个", () => {
    expect(pageTypeCases).toHaveLength(210);
  });

  it.each(pageTypeCases)("$name", ({ input, pageType }) => {
    expect(decomposeRequirement(input).pageType).toBe(pageType);
  });
});
