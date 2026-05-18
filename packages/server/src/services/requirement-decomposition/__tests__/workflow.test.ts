import { describe, expect, it } from "vitest";
import { deriveWorkflowActions } from "../workflow.js";
import { adminDetailProfile } from "../page-profiles/admin-detail.js";

describe("deriveWorkflowActions", () => {
  const workflow = adminDetailProfile.workflow!;

  it("按当前状态派生可用动作", () => {
    const actions = deriveWorkflowActions(workflow, {
      currentState: "pending",
      userPermissions: ["article.process", "article.approve"]
    });

    expect(actions).toEqual([
      expect.objectContaining({
        action: "process",
        from: "pending",
        to: "processing",
        label: "开始处理",
        disabled: false
      }),
      expect.objectContaining({
        action: "approve",
        from: "pending",
        to: "approved",
        label: "审核通过",
        disabled: false
      }),
      expect.objectContaining({
        action: "reject",
        from: "pending",
        to: "rejected",
        label: "驳回",
        disabled: true
      })
    ]);
  });

  it("支持额外业务禁用态覆盖", () => {
    const actions = deriveWorkflowActions(workflow, {
      currentState: "draft",
      userPermissions: ["article.submit"],
      extraDisabledActions: ["submit"]
    });

    expect(actions).toEqual([
      expect.objectContaining({
        action: "submit",
        to: "pending",
        disabled: true
      })
    ]);
  });
});
