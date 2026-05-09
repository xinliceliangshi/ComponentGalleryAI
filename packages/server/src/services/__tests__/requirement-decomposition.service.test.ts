import { describe, expect, it } from "vitest";
import { buildDecompositionQueries, decomposeRequirement } from "../requirement-decomposition.service.js";

type PageTypeCase = {
  name: string;
  input: string;
  pageType: string;
};

const pageTypeCases: PageTypeCase[] = [
  { name: "detail-001 审核详情完整结构", input: "做一个后台审核详情页，包含标题、状态Tag、操作按钮、基础信息、审核记录", pageType: "admin-detail" },
  { name: "detail-002 订单详情", input: "做一个后台订单详情页，顶部展示状态和可操作按钮，下方是基础信息和操作日志", pageType: "admin-detail" },
  { name: "detail-003 内容详情", input: "做一个后台内容详情页，包含富文本内容、图片、引用、审核记录和时间线", pageType: "admin-detail" },
  { name: "detail-004 工单详情", input: "做一个后台工单详情页，显示处理状态、基础信息、处理意见和操作日志", pageType: "admin-detail" },
  { name: "detail-005 用户详情", input: "做一个后台用户详情页，包含用户资料、权限状态、操作按钮和审核记录", pageType: "admin-detail" },
  { name: "detail-006 商品详情", input: "做一个后台商品详情页，顶部有上下架状态、编辑按钮、基础信息和变更历史", pageType: "admin-detail" },
  { name: "detail-007 退款详情", input: "做一个后台退款详情页，展示退款状态、审批记录、基础信息和操作日志", pageType: "admin-detail" },
  { name: "detail-008 发票详情", input: "做一个后台发票详情页，包含开票状态、基础信息、审核记录和日志时间线", pageType: "admin-detail" },
  { name: "detail-009 活动详情", input: "做一个后台活动详情页，展示活动状态、操作按钮、基础信息和审核历史", pageType: "admin-detail" },
  { name: "detail-010 文章详情", input: "做一个后台文章详情页，包含正文 markdown、状态标签、审核记录和操作日志", pageType: "admin-detail" },
  { name: "detail-011 广告详情", input: "做一个后台广告详情页，展示投放状态、基础信息、素材内容和审批记录", pageType: "admin-detail" },
  { name: "detail-012 合同详情", input: "做一个后台合同详情页，包含签署状态、基础信息、附件内容和审核记录", pageType: "admin-detail" },
  { name: "detail-013 客户详情", input: "做一个后台客户详情页，展示客户资料、状态、跟进记录和操作日志", pageType: "admin-detail" },
  { name: "detail-014 供应商详情", input: "做一个后台供应商详情页，包含资质状态、基础信息、审核记录和历史时间线", pageType: "admin-detail" },
  { name: "detail-015 门店详情", input: "做一个后台门店详情页，展示营业状态、基础资料、审核记录和操作日志", pageType: "admin-detail" },
  { name: "detail-016 课程详情", input: "做一个后台课程详情页，包含发布状态、课程内容、基础信息和审核记录", pageType: "admin-detail" },
  { name: "detail-017 班级详情", input: "做一个后台班级详情页，展示状态、基础信息、操作按钮和日志时间线", pageType: "admin-detail" },
  { name: "detail-018 会员详情", input: "做一个后台会员详情页，包含会员状态、基础资料、权益内容和操作日志", pageType: "admin-detail" },
  { name: "detail-019 账户详情", input: "做一个后台账户详情页，顶部展示冻结状态、权限按钮、基础信息和审核记录", pageType: "admin-detail" },
  { name: "detail-020 风控详情", input: "做一个后台风控详情页，包含风险状态、基础信息、审核记录和处置日志", pageType: "admin-detail" },
  { name: "detail-021 审批详情", input: "做一个后台审批详情页，显示当前状态、通过拒绝按钮、业务信息和流转记录", pageType: "admin-detail" },
  { name: "detail-022 结算详情", input: "做一个后台结算详情页，包含结算状态、基础信息、审批记录和操作日志", pageType: "admin-detail" },
  { name: "detail-023 充值详情", input: "做一个后台充值详情页，展示支付状态、基础信息、审核记录和时间线", pageType: "admin-detail" },
  { name: "detail-024 提现详情", input: "做一个后台提现详情页，包含审核状态、基础信息、审批记录和操作日志", pageType: "admin-detail" },
  { name: "detail-025 库存详情", input: "做一个后台库存详情页，展示状态、基础信息、调整记录和操作日志", pageType: "admin-detail" },
  { name: "detail-026 物流详情", input: "做一个后台物流详情页，包含运输状态、基础信息、轨迹时间线和操作日志", pageType: "admin-detail" },
  { name: "detail-027 售后详情", input: "做一个后台售后详情页，展示处理状态、基础资料、审核记录和日志", pageType: "admin-detail" },
  { name: "detail-028 投诉详情", input: "做一个后台投诉详情页，包含处理状态、投诉内容、审核记录和时间线", pageType: "admin-detail" },
  { name: "detail-029 举报详情", input: "做一个后台举报详情页，展示处置状态、内容详情、审核记录和操作日志", pageType: "admin-detail" },
  { name: "detail-030 任务详情", input: "做一个后台任务详情页，包含任务状态、基础信息、执行日志和历史时间线", pageType: "admin-detail" },
  { name: "detail-031 项目详情", input: "做一个后台项目详情页，展示项目状态、基础资料、审批记录和操作日志", pageType: "admin-detail" },
  { name: "detail-032 版本详情", input: "做一个后台版本详情页，包含发布状态、版本内容、审核记录和日志", pageType: "admin-detail" },
  { name: "detail-033 发布详情", input: "做一个后台发布详情页，展示发布状态、内容详情、审核历史和操作日志", pageType: "admin-detail" },
  { name: "detail-034 素材详情", input: "做一个后台素材详情页，包含图片预览、状态标签、审核记录和基础信息", pageType: "admin-detail" },
  { name: "detail-035 模板详情", input: "做一个后台模板详情页，展示启用状态、html 内容、审核记录和操作日志", pageType: "admin-detail" },
  { name: "detail-036 权限详情", input: "做一个后台权限详情页，包含权限状态、基础信息、变更审核记录和时间线", pageType: "admin-detail" },
  { name: "detail-037 角色详情", input: "做一个后台角色详情页，展示启用状态、基础资料、权限内容和操作日志", pageType: "admin-detail" },
  { name: "detail-038 租户详情", input: "做一个后台租户详情页，包含租户状态、基础信息、审核记录和日志", pageType: "admin-detail" },
  { name: "detail-039 组织详情", input: "做一个后台组织详情页，展示组织状态、基础信息、审批记录和操作日志", pageType: "admin-detail" },
  { name: "detail-040 员工详情", input: "做一个后台员工详情页，包含在职状态、基础资料、权限信息和操作日志", pageType: "admin-detail" },
  { name: "detail-041 数据详情", input: "做一个后台数据详情页，展示处理状态、基础信息、内容详情和审核记录", pageType: "admin-detail" },
  { name: "detail-042 运营详情", input: "做一个运营审核详情页，顶部状态驱动按钮，下面是基础信息和审核记录", pageType: "admin-detail" },
  { name: "detail-043 管理系统审批详情", input: "做一个管理系统审批详情页，包含状态文案、操作按钮、业务历史和操作日志", pageType: "admin-detail" },
  { name: "detail-044 后台明细强状态", input: "做一个后台交易明细页面，包含状态、基础信息、审核记录和操作日志", pageType: "admin-detail" },
  { name: "detail-045 后台资料强状态", input: "做一个后台商家资料页面，顶部状态Tag，包含基础信息、审核记录和处理意见", pageType: "admin-detail" },
  { name: "detail-046 审核详情短句", input: "后台审核详情页，状态、按钮、基础信息、审核记录", pageType: "admin-detail" },
  { name: "detail-047 审批详情短句", input: "后台审批详情页，状态驱动操作按钮，展示审核记录", pageType: "admin-detail" },
  { name: "detail-048 订单详情短句", input: "后台订单详情页，基础信息、内容详情、操作日志", pageType: "admin-detail" },
  { name: "detail-049 内容详情短句", input: "后台内容详情页，markdown正文、状态标签、审核记录", pageType: "admin-detail" },
  { name: "detail-050 工单详情短句", input: "后台工单详情页，状态Tag、处理按钮、时间线", pageType: "admin-detail" },

  { name: "management-001 用户管理列表", input: "做一个后台用户管理页面，包含筛选、表格、批量操作和分页", pageType: "admin-management" },
  { name: "management-002 订单管理表格", input: "做一个后台订单管理页面，支持查询、表格、状态筛选和分页", pageType: "admin-management" },
  { name: "management-003 内容管理列表", input: "做一个后台内容管理列表，包含搜索、批量下架、详情抽屉和编辑弹窗", pageType: "admin-management" },
  { name: "management-004 商品管理", input: "做一个后台商品管理页面，包含分类筛选、数据表格、批量导出和分页", pageType: "admin-management" },
  { name: "management-005 审核列表", input: "做一个后台审核列表，包含状态筛选、表格、批量通过和详情抽屉", pageType: "admin-management" },
  { name: "management-006 审批管理", input: "做一个后台审批管理页面，包含查询条件、列表、批量拒绝和分页", pageType: "admin-management" },
  { name: "management-007 退款列表", input: "做一个后台退款列表页面，支持筛选、表格、详情抽屉和分页", pageType: "admin-management" },
  { name: "management-008 发票管理", input: "做一个后台发票管理页面，包含检索、数据表格、导出和批量操作", pageType: "admin-management" },
  { name: "management-009 广告管理", input: "做一个后台广告管理列表，包含搜索、表格、编辑弹窗和分页", pageType: "admin-management" },
  { name: "management-010 合同管理", input: "做一个后台合同管理页面，包含筛选、列表、详情抽屉和批量归档", pageType: "admin-management" },
  { name: "management-011 客户管理", input: "做一个后台客户管理页面，支持查询、表格、状态标签和分页", pageType: "admin-management" },
  { name: "management-012 供应商管理", input: "做一个后台供应商管理列表，包含筛选、表格、审核状态和分页", pageType: "admin-management" },
  { name: "management-013 门店管理", input: "做一个后台门店管理页面，包含地区筛选、表格、批量启用和分页", pageType: "admin-management" },
  { name: "management-014 课程管理", input: "做一个后台课程管理页面，包含搜索、列表、新建弹窗和分页", pageType: "admin-management" },
  { name: "management-015 会员管理", input: "做一个后台会员管理列表，支持筛选、表格、批量打标签和分页", pageType: "admin-management" },
  { name: "management-016 账户管理", input: "做一个后台账户管理页面，包含查询、表格、冻结按钮和分页", pageType: "admin-management" },
  { name: "management-017 风控管理", input: "做一个后台风控管理列表，包含风险等级筛选、表格、详情抽屉和分页", pageType: "admin-management" },
  { name: "management-018 结算管理", input: "做一个后台结算管理页面，包含日期筛选、数据表格、批量导出和分页", pageType: "admin-management" },
  { name: "management-019 物流管理", input: "做一个后台物流管理列表，包含筛选、表格、轨迹详情抽屉和分页", pageType: "admin-management" },
  { name: "management-020 售后管理", input: "做一个后台售后管理页面，包含状态查询、列表、批量处理和分页", pageType: "admin-management" },
  { name: "management-021 投诉管理", input: "做一个后台投诉管理列表，包含搜索、表格、处理弹窗和分页", pageType: "admin-management" },
  { name: "management-022 举报管理", input: "做一个后台举报管理页面，包含筛选、表格、详情抽屉和批量处置", pageType: "admin-management" },
  { name: "management-023 任务管理", input: "做一个后台任务管理列表，包含查询、表格、批量分配和分页", pageType: "admin-management" },
  { name: "management-024 项目管理", input: "做一个后台项目管理页面，包含筛选、列表、编辑弹窗和分页", pageType: "admin-management" },
  { name: "management-025 版本管理", input: "做一个后台版本管理列表，包含状态筛选、表格、发布按钮和分页", pageType: "admin-management" },
  { name: "management-026 素材管理", input: "做一个后台素材管理页面，包含搜索、表格、图片预览和批量删除", pageType: "admin-management" },
  { name: "management-027 模板管理", input: "做一个后台模板管理列表，包含查询、数据表格、启用禁用和分页", pageType: "admin-management" },
  { name: "management-028 权限管理", input: "做一个后台权限管理页面，包含角色筛选、表格、编辑弹窗和分页", pageType: "admin-management" },
  { name: "management-029 组织管理", input: "做一个后台组织管理列表，包含搜索、表格、批量调整和分页", pageType: "admin-management" },
  { name: "management-030 详情页列表反例", input: "做一个后台详情页列表，包含筛选、表格、详情抽屉和分页", pageType: "admin-management" },

  { name: "home-001 管理首页", input: "做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口", pageType: "admin-home-dashboard" },
  { name: "home-002 运营工作台", input: "做一个后台运营工作台，包含指标概览、趋势图表、审批待办和公告动态", pageType: "admin-home-dashboard" },
  { name: "home-003 控制台", input: "做一个后台控制台，展示今日数据、快捷操作、预警提醒和最近动态", pageType: "admin-home-dashboard" },
  { name: "home-004 数据总览", input: "做一个后台数据总览页面，包含核心指标、折线趋势、任务提醒和快捷入口", pageType: "admin-home-dashboard" },
  { name: "home-005 仪表盘", input: "做一个后台仪表盘，展示统计卡片、可视化图表、待办审批和消息记录", pageType: "admin-home-dashboard" },
  { name: "home-006 看板", input: "做一个后台看板，包含数据概览、趋势统计、常用操作和日志动态", pageType: "admin-home-dashboard" },
  { name: "home-007 首页短句", input: "后台首页，核心指标、趋势图表、快捷入口、待办事项", pageType: "admin-home-dashboard" },
  { name: "home-008 管理系统首页", input: "管理系统首页，需要指标卡片、统计图表、任务待办和公告", pageType: "admin-home-dashboard" },
  { name: "home-009 运营概览", input: "后台运营概览，包含今日数据、走势、预警和快捷发布入口", pageType: "admin-home-dashboard" },
  { name: "home-010 dashboard", input: "后台 Dashboard，展示核心指标、趋势、审批提醒和最近动态", pageType: "admin-home-dashboard" },

  { name: "dashboard-001 普通统计看板", input: "做一个销售统计看板，包含指标、趋势图表和区域排行", pageType: "dashboard" },
  { name: "dashboard-002 数据仪表盘", input: "做一个数据仪表盘，展示访问量、转化率、折线图和柱状图", pageType: "dashboard" },
  { name: "dashboard-003 业务统计", input: "做一个业务统计页面，包含图表、趋势、指标和可视化分析", pageType: "dashboard" },
  { name: "dashboard-004 营销看板", input: "做一个营销看板，展示投放趋势、渠道占比和统计图表", pageType: "dashboard" },
  { name: "dashboard-005 财务图表", input: "做一个财务图表页面，包含收入趋势、支出统计和可视化", pageType: "dashboard" },

  { name: "form-001 申请表单", input: "做一个请假申请表单，包含填写信息、提交和校验", pageType: "form-page" },
  { name: "form-002 入驻表单", input: "做一个商家入驻表单，需要填写资料、上传附件和提交审核", pageType: "form-page" },
  { name: "form-003 报名表单", input: "做一个活动报名表单，包含姓名、联系方式、提交按钮和校验", pageType: "form-page" },
  { name: "form-004 反馈表单", input: "做一个问题反馈表单，支持填写描述、上传图片和提交", pageType: "form-page" },
  { name: "form-005 资料提交", input: "做一个资料提交页面，包含填写字段、附件上传和提交确认", pageType: "form-page" }
];

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
        "status-summary",
        "status-actions",
        "base-info",
        "content-detail",
        "audit-records",
        "operation-log",
        "timeline"
      ])
    );
    expect(result.subtasks.map((task) => task.id)).not.toContain("table");
    expect(result.constraints).toContain("不要把后台详情页生成成列表页或 CRUD 表格页");
  });

  it("后台详情页输出页面结构 DSL 模块", () => {
    const result = decomposeRequirement(
      "做一个后台审核详情页，顶部展示标题、状态Tag和操作按钮，包含基础信息、内容详情、审核记录和操作日志时间线"
    );

    expect(result.modules?.map((module) => module.type)).toEqual([
      "detailHeader",
      "statusSummary",
      "statusActions",
      "baseInfo",
      "contentDetail",
      "auditRecords",
      "operationLog",
      "timeline"
    ]);
    expect(result.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "baseInfo",
          required: true,
          layout: "descriptions-grid"
        }),
        expect.objectContaining({
          type: "auditRecords",
          required: true,
          layout: "business-history-card"
        }),
        expect.objectContaining({
          type: "operationLog",
          required: false
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
    expect(result.modules).toBeUndefined();
  });

  it("页面类型样例数量保持为 100 个", () => {
    expect(pageTypeCases).toHaveLength(100);
  });

  it.each(pageTypeCases)("$name", ({ input, pageType }) => {
    expect(decomposeRequirement(input).pageType).toBe(pageType);
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

  it("首页拆分会生成面向 dashboard 模块的召回查询", () => {
    const input = "做一个后台管理首页，展示核心指标、趋势统计、待办事项和快捷入口";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("核心指标概览"))).toBe(true);
    expect(queries.some((query) => query.includes("dashboard-trend"))).toBe(true);
    expect(queries.some((query) => query.includes("快捷入口"))).toBe(true);
  });

  it("详情页拆分会生成面向状态、基础信息和审核记录的召回查询", () => {
    const input = "做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("状态驱动 UI"))).toBe(true);
    expect(queries.some((query) => query.includes("基础信息区"))).toBe(true);
    expect(queries.some((query) => query.includes("审核记录"))).toBe(true);
    expect(queries.some((query) => query.includes("富文本"))).toBe(true);
  });

  it("详情页模块 DSL 会补充组件级召回查询", () => {
    const input = "做一个后台审核详情页，包含状态Tag、基础信息、内容详情、审核记录和操作日志";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(queries.some((query) => query.includes("ZhDetailHeader"))).toBe(true);
    expect(queries.some((query) => query.includes("ZhDetailSubTitle"))).toBe(true);
    expect(queries.some((query) => query.includes("ZhButtonGroup"))).toBe(true);
    expect(queries.some((query) => query.includes("ZhBaseInfo"))).toBe(true);
    expect(queries.some((query) => query.includes("business-history-card"))).toBe(true);
  });

  it("普通管理页不会生成详情页模块组件查询", () => {
    const input = "做一个后台用户管理页面，包含筛选、表格、详情抽屉、编辑弹窗和分页";
    const result = decomposeRequirement(input);
    const queries = buildDecompositionQueries(input, result);

    expect(result.modules).toBeUndefined();
    expect(queries.some((query) => query.includes("ZhDetailHeader"))).toBe(false);
    expect(queries.some((query) => query.includes("business-history-card"))).toBe(false);
  });
});
