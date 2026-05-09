import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";
import { adminDetailProfile } from "./admin-detail.js";
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

export const requirementPageProfiles: RequirementPageProfile[] = [
  adminHomeDashboardProfile,
  adminDetailProfile,
  adminManagementProfile,
  dashboardProfile,
  formPageProfile
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
