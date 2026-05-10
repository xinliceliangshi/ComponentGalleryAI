import { includesAny } from "../matchers.js";
import type { RequirementPageProfile } from "../types.js";
import { adminCreateProfile } from "./admin-create.js";
import { adminDetailProfile } from "./admin-detail.js";
import { adminEditProfile } from "./admin-edit.js";
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

// Keep more specific backend page types ahead of generic management/list pages:
// - admin-home-dashboard: KPI/trend/todo driven home page
// - admin-detail: status + base info + audit/log driven detail page
// - admin-edit: status/permission/history/preview driven complex edit page
// - admin-create: creation form and lightweight edit reuse
// - admin-management: list/filter/table/pagination driven CRUD page
export const requirementPageProfiles: RequirementPageProfile[] = [
  adminHomeDashboardProfile,
  adminDetailProfile,
  adminEditProfile,
  adminCreateProfile,
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
