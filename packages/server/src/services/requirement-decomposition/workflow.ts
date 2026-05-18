import type {
  RequirementWorkflow,
  WorkflowAction,
  WorkflowActionDefinition,
  WorkflowActionVariant,
  WorkflowState
} from "./types.js";

export type DerivedWorkflowAction = WorkflowActionDefinition & {
  action: WorkflowAction;
  from: WorkflowState;
  to: WorkflowState;
  disabled: boolean;
};

type DeriveWorkflowActionsOptions = {
  currentState: WorkflowState;
  userPermissions?: string[];
  extraDisabledActions?: WorkflowAction[];
};

function hasRequiredPermissions(action: WorkflowActionDefinition, userPermissions: string[]): boolean {
  if (!action.permissions?.length) return true;

  return action.permissions.every((permission) => userPermissions.includes(permission));
}

export function deriveWorkflowActions(
  workflow: RequirementWorkflow,
  options: DeriveWorkflowActionsOptions
): DerivedWorkflowAction[] {
  const userPermissions = options.userPermissions ?? [];
  const extraDisabledActions = new Set(options.extraDisabledActions ?? []);

  return workflow.transitions
    .filter((transition) => transition.from === options.currentState)
    .map((transition) => ({
      ...transition.action,
      action: transition.action.key,
      from: transition.from,
      to: transition.to,
      disabled: !hasRequiredPermissions(transition.action, userPermissions)
        || extraDisabledActions.has(transition.action.key)
    }));
}

export function collectWorkflowSearchTerms(workflow: RequirementWorkflow): string[] {
  const collected = new Set<string>();
  collected.add(workflow.id);
  collected.add(workflow.initialState);

  for (const transition of workflow.transitions) {
    collected.add(transition.from);
    collected.add(transition.to);
    collected.add(transition.action.key);
    collected.add(transition.action.label ?? "");
    collected.add(transition.action.variant ?? "");
    collected.add(transition.action.confirmText ?? "");
    for (const permission of transition.action.permissions ?? []) collected.add(permission);
  }

  for (const word of Array.from(collected)) {
    if (word === "draft") collected.add("草稿");
    if (word === "pending") collected.add("待审核");
    if (word === "processing") collected.add("处理中");
    if (word === "approved") collected.add("已通过");
    if (word === "rejected") collected.add("已拒绝");
    if (word === "submit") collected.add("提交");
    if (word === "process") collected.add("处理");
    if (word === "approve") collected.add("通过");
    if (word === "reject") collected.add("拒绝");
    if (word === "resubmit") collected.add("重新提交");
  }

  return Array.from(collected).filter(Boolean);
}

export function formatWorkflowActionVariant(variant: WorkflowActionVariant | undefined): string {
  return variant ?? "default";
}
