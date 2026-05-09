import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";
import { adminHomeDashboardProfile } from "./admin-home-dashboard.js";
import { adminManagementProfile } from "./admin-management.js";

const dashboardProfile: RequirementPageProfile = {
  pageType: "dashboard",
  match: (text) => includesAny(text, ["看板", "仪表盘", "统计", "图表"]),
  rules: adminManagementProfile.rules,
  constraints: adminManagementProfile.constraints
};

const formPageProfile: RequirementPageProfile = {
  pageType: "form-page",
  match: (text) => includesAny(text, ["表单", "填写", "提交", "申请"]),
  rules: adminManagementProfile.rules,
  constraints: adminManagementProfile.constraints
};

const detailPageProfile: RequirementPageProfile = {
  pageType: "detail-page",
  match: (text) => includesAny(text, ["详情", "资料", "信息"]),
  rules: adminManagementProfile.rules,
  constraints: adminManagementProfile.constraints
};

export const requirementPageProfiles: RequirementPageProfile[] = [
  adminHomeDashboardProfile,
  adminManagementProfile,
  dashboardProfile,
  formPageProfile,
  detailPageProfile
];

export const fallbackRequirementProfile: RequirementPageProfile = {
  pageType: "general-ui",
  match: () => true,
  rules: adminManagementProfile.rules,
  constraints: adminManagementProfile.constraints
};

export function matchRequirementPageProfile(text: string): RequirementPageProfile {
  return requirementPageProfiles.find((profile) => profile.match(text)) ?? fallbackRequirementProfile;
}
