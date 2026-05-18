export type RequirementSubtaskPriority = "must" | "should" | "nice";
export type RequirementSectionKind =
  | "page-header"
  | "status-banner"
  | "status-actions"
  | "validation-summary"
  | "form-body"
  | "grouped-form"
  | "upload-panel"
  | "relation-editor"
  | "preview-panel"
  | "history-panel"
  | "base-info"
  | "content-detail"
  | "audit-records"
  | "operation-log"
  | "timeline"
  | "action-footer";

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

export type RequirementSection = {
  kind: RequirementSectionKind;
  required: boolean;
  priority: RequirementSubtaskPriority;
  layout?: string;
  intent?: string;
  uiRegion?: string;
  sourceSubtaskId?: string;
};

export type RequirementSectionBlueprintWhen = "always" | "matched-subtask" | "page-type";

export type RequirementSectionBlueprint = {
  kind: RequirementSectionKind;
  required: boolean;
  priority: RequirementSubtaskPriority;
  layout?: string;
  intent?: string;
  uiRegion?: string;
  sourceSubtaskIds?: string[];
  when?: RequirementSectionBlueprintWhen;
};

export type WorkflowState = "draft" | "pending" | "processing" | "approved" | "rejected";

export type WorkflowAction =
  | "submit"
  | "process"
  | "approve"
  | "reject"
  | "resubmit";

export type WorkflowActionVariant = "primary" | "default" | "danger" | "success";

export type WorkflowActionDefinition = {
  key: WorkflowAction;
  label?: string;
  variant?: WorkflowActionVariant;
  permissions?: string[];
  confirmText?: string;
};

export type WorkflowTransition = {
  from: WorkflowState;
  to: WorkflowState;
  action: WorkflowActionDefinition;
};

export type RequirementWorkflow = {
  id: string;
  initialState: WorkflowState;
  transitions: WorkflowTransition[];
};

export type RequirementDecomposition = {
  enabled: boolean;
  summary: string;
  pageType: string;
  userGoal: string;
  subtasks: RequirementSubtask[];
  sections?: RequirementSection[];
  workflow?: RequirementWorkflow;
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
  sectionBlueprints?: RequirementSectionBlueprint[];
  workflow?: RequirementWorkflow;
  constraints: string[];
};
