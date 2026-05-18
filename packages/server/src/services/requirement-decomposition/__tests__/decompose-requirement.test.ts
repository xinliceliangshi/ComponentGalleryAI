import { describe, expect, it } from "vitest";
import { decomposeRequirement } from "../../requirement-decomposition.service.js";

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

  it("后台管理首页优先识别为首页工作台而不是普通管理页", () => {
    const result = decomposeRequirement("做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口");

    expect(result.enabled).toBe(true);
    expect(result.pageType).toBe("admin-home-dashboard");
    expect(result.subtasks.map((task) => task.id)).toEqual(
      expect.arrayContaining(["kpi-overview", "trend-chart", "todo-list", "quick-actions"])
    );
    expect(result.subtasks.map((task) => task.id)).not.toContain("table");
    expect(result.constraints).toContain("不要把首页生成成单一 CRUD 表格页；表格只能作为辅助模块，不能成为页面主体");
  });

  it("后台审核详情页优先识别为详情页而不是普通管理页", () => {
    const result = decomposeRequirement(
      "做一个后台审核详情页，顶部展示标题、状态Tag和操作按钮，包含基础信息、内容详情、审核记录和操作日志时间线"
    );

    expect(result.enabled).toBe(true);
    expect(result.pageType).toBe("admin-detail");
    expect(result.subtasks.map((task) => task.id)).toEqual(
      expect.arrayContaining([
        "detail-header",
        "base-info",
        "content-detail",
        "audit-records",
        "operation-log",
        "timeline"
      ])
    );
    expect(result.subtasks.map((task) => task.id)).not.toContain("status-summary");
    expect(result.subtasks.map((task) => task.id)).not.toContain("status-actions");
    expect(result.subtasks.map((task) => task.id)).not.toContain("table");
    expect(result.constraints).toContain("不要把后台详情页生成成列表页或 CRUD 表格页");
  });

  it("后台详情页文本命中状态词时输出 workflow 状态机模板", () => {
    const result = decomposeRequirement(
      "做一个后台审核详情页，顶部展示标题、状态Tag，包含草稿、待审核、已通过几种状态切换，以及基础信息、审核记录"
    );

    expect(result.workflow).toEqual({
      id: "article-audit",
      initialState: "draft",
      transitions: [
        {
          from: "draft",
          to: "pending",
          action: {
            key: "submit",
            label: "提交审核",
            variant: "primary",
            permissions: ["article.submit"],
            confirmText: "确认提交审核？"
          }
        },
        {
          from: "pending",
          to: "processing",
          action: {
            key: "process",
            label: "开始处理",
            variant: "default",
            permissions: ["article.process"]
          }
        },
        {
          from: "pending",
          to: "approved",
          action: {
            key: "approve",
            label: "审核通过",
            variant: "success",
            permissions: ["article.approve"],
            confirmText: "确认审核通过？"
          }
        },
        {
          from: "pending",
          to: "rejected",
          action: {
            key: "reject",
            label: "驳回",
            variant: "danger",
            permissions: ["article.reject"],
            confirmText: "确认驳回当前内容？"
          }
        },
        {
          from: "processing",
          to: "approved",
          action: {
            key: "approve",
            label: "处理完成并通过",
            variant: "success",
            permissions: ["article.approve"],
            confirmText: "确认处理完成并通过？"
          }
        },
        {
          from: "processing",
          to: "rejected",
          action: {
            key: "reject",
            label: "处理后驳回",
            variant: "danger",
            permissions: ["article.reject"],
            confirmText: "确认处理后驳回？"
          }
        },
        {
          from: "rejected",
          to: "draft",
          action: {
            key: "resubmit",
            label: "退回草稿",
            variant: "default",
            permissions: ["article.update"]
          }
        }
      ]
    });
    expect(result.sections?.map((section) => section.kind)).not.toContain("status-banner");
    expect(result.sections?.map((section) => section.kind)).not.toContain("status-actions");
  });

  it("后台详情页文本未命中任何状态词时不输出 workflow", () => {
    const result = decomposeRequirement(
      "做一个后台审核详情页，顶部展示标题和操作按钮，包含基础信息、内容详情、审核记录和操作日志时间线"
    );

    expect(result.pageType).toBe("admin-detail");
    expect(result.workflow).toBeUndefined();
  });

  it("后台详情页输出页面结构 DSL 模块", () => {
    const result = decomposeRequirement(
      "做一个后台审核详情页，顶部展示标题、状态Tag和操作按钮，包含基础信息、内容详情、审核记录和操作日志时间线"
    );

    expect(result.sections?.map((section) => section.kind)).toEqual([
      "page-header",
      "base-info",
      "content-detail",
      "audit-records",
      "operation-log",
      "timeline"
    ]);
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "page-header",
          required: true,
          layout: "header-title-status-actions"
        }),
        expect.objectContaining({
          kind: "base-info",
          required: true,
          layout: "descriptions-grid"
        }),
        expect.objectContaining({
          kind: "audit-records",
          required: true,
          layout: "business-history-card"
        }),
        expect.objectContaining({
          kind: "operation-log",
          required: false
        })
      ])
    );
  });

  it("后台新增页优先识别为独立新增页而不是普通管理页", () => {
    const result = decomposeRequirement(
      "做一个后台新增商品页面，包含基础信息、价格设置、封面上传、必填校验和提交按钮"
    );

    expect(result.enabled).toBe(true);
    expect(result.pageType).toBe("admin-create");
    expect(result.subtasks.map((task) => task.id)).toEqual(
      expect.arrayContaining(["create-header", "basic-form", "upload", "field-validation", "submit-actions"])
    );
    expect(result.subtasks.map((task) => task.id)).not.toContain("table");
    expect(result.constraints).toContain("页面主体必须是表单录入，不要生成成 CRUD 列表页或详情页");
  });

  it("后台新增页输出页面结构 DSL 模块", () => {
    const result = decomposeRequirement(
      "做一个后台新建用户页面，包含基本资料、角色选择、头像上传、校验规则和保存提交"
    );

    expect(result.sections?.map((section) => section.kind)).toEqual([
      "page-header",
      "form-body",
      "grouped-form",
      "upload-panel",
      "validation-summary",
      "action-footer"
    ]);
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "form-body",
          required: true,
          layout: "primary-form-card"
        }),
        expect.objectContaining({
          kind: "validation-summary",
          required: true,
          layout: "inline-validation-summary"
        }),
        expect.objectContaining({
          kind: "action-footer",
          required: true,
          layout: "sticky-footer-actions"
        })
      ])
    );
  });

  it("复杂编辑页优先识别为 admin-edit，而不是新增页或普通管理页", () => {
    const result = decomposeRequirement(
      "做一个后台编辑活动页面，包含状态流转、权限控制、变更记录和预览"
    );

    expect(result.pageType).toBe("admin-edit");
    expect(result.enabled).toBe(true);
    expect(result.subtasks.map((task) => task.id)).toEqual(
      expect.arrayContaining([
        "edit-header",
        "status-context",
        "editable-form",
        "preview-panel",
        "validation-diff",
        "history-panel"
      ])
    );
  });

  it("轻编辑仍复用新增页，不升级为复杂编辑页", () => {
    const result = decomposeRequirement(
      "做一个后台编辑商品页面，包含基础信息、封面上传和保存按钮"
    );

    expect(result.pageType).toBe("admin-create");
  });

  it("复杂编辑页输出页面结构 DSL 模块", () => {
    const result = decomposeRequirement(
      "做一个后台修改商品页面，包含发布状态、只读字段、差异对比和实时预览"
    );

    expect(result.sections?.map((section) => section.kind)).toEqual([
      "page-header",
      "status-banner",
      "form-body",
      "grouped-form",
      "preview-panel",
      "validation-summary",
      "history-panel",
      "action-footer"
    ]);
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "page-header",
          required: true,
          layout: "header-title-status-actions"
        }),
        expect.objectContaining({
          kind: "validation-summary",
          required: true,
          layout: "inline-validation-diff-summary"
        }),
        expect.objectContaining({
          kind: "action-footer",
          required: true,
          layout: "sticky-footer-multi-actions"
        })
      ])
    );
  });

  it("包含详情抽屉的后台管理列表仍识别为普通管理页", () => {
    const result = decomposeRequirement(
      "做一个后台用户管理页面，包含筛选、表格、批量操作、详情抽屉、编辑弹窗、权限状态和分页"
    );

    expect(result.pageType).toBe("admin-management");
    expect(result.subtasks.map((task) => task.id)).toContain("table");
    expect(result.subtasks.map((task) => task.id)).toContain("detail-drawer");
    expect(result.sections).toBeUndefined();
  });
});
