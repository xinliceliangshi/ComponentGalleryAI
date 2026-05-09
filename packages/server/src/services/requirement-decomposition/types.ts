export type RequirementSubtaskPriority = "must" | "should" | "nice";

export type RequirementSubtask = {
  id: string;
  title: string;
  intent: string;
  priority: RequirementSubtaskPriority;
  uiRegion?: string;
  dataNeeds: string[];
  interactionNeeds: string[];
  candidateKeywords: string[];
};

export type RequirementDecomposition = {
  enabled: boolean;
  summary: string;
  pageType: string;
  userGoal: string;
  subtasks: RequirementSubtask[];
  constraints: string[];
  risks: string[];
};

export type IntentRule = {
  id: string;
  title: string;
  intent: string;
  priority: RequirementSubtaskPriority;
  uiRegion?: string;
  terms: string[];
  dataNeeds?: string[];
  interactionNeeds?: string[];
  candidateKeywords: string[];
};

export type RequirementPageProfile = {
  pageType: string;
  match: (text: string) => boolean;
  rules: IntentRule[];
  constraints: string[];
};
