from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RequirementSubtaskPriority = Literal["must", "should", "nice"]
RequirementSectionKind = Literal[
    "page-header",
    "status-banner",
    "status-actions",
    "validation-summary",
    "form-body",
    "grouped-form",
    "upload-panel",
    "relation-editor",
    "preview-panel",
    "history-panel",
    "base-info",
    "content-detail",
    "audit-records",
    "operation-log",
    "timeline",
    "action-footer",
]
WorkflowState = Literal["draft", "pending", "processing", "approved", "rejected"]
WorkflowAction = Literal["submit", "process", "approve", "reject", "resubmit"]
WorkflowActionVariant = Literal["primary", "default", "danger", "success"]
PageType = Literal[
    "admin-home-dashboard",
    "admin-detail",
    "admin-create",
    "admin-edit",
    "admin-management",
]
RecommendationPriority = Literal["high", "medium", "low"]


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
    )


class ComponentRec(StrictModel):
    name: str = Field(min_length=1)
    usage: str = Field(min_length=1)


class GenerateResult(StrictModel):
    components: list[ComponentRec] = Field(default_factory=list)
    explanation: str = Field(min_length=1)
    code: str = Field(min_length=1)
    tips: list[str] = Field(default_factory=list)
    page_type: PageType | None = None
    used_components: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class RequirementSubtask(StrictModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    intent: str = Field(min_length=1)
    priority: RequirementSubtaskPriority
    ui_region: str | None = None
    data_needs: list[str] = Field(default_factory=list)
    interaction_needs: list[str] = Field(default_factory=list)
    candidate_keywords: list[str] = Field(default_factory=list)


class RequirementSection(StrictModel):
    kind: RequirementSectionKind
    required: bool
    priority: RequirementSubtaskPriority
    layout: str | None = None
    intent: str | None = None
    ui_region: str | None = None
    source_subtask_id: str | None = None


class WorkflowActionDefinition(StrictModel):
    key: WorkflowAction
    label: str | None = None
    variant: WorkflowActionVariant | None = None
    permissions: list[str] = Field(default_factory=list)
    confirm_text: str | None = None


class WorkflowTransition(StrictModel):
    from_state: WorkflowState = Field(
        validation_alias="from",
        serialization_alias="from",
    )
    to_state: WorkflowState = Field(
        validation_alias="to",
        serialization_alias="to",
    )
    action: WorkflowActionDefinition


class RequirementWorkflow(StrictModel):
    id: str = Field(min_length=1)
    initial_state: WorkflowState
    transitions: list[WorkflowTransition] = Field(min_length=1)


class RequirementDecomposition(StrictModel):
    enabled: bool
    summary: str = Field(min_length=1)
    page_type: PageType
    user_goal: str = Field(min_length=1)
    subtasks: list[RequirementSubtask] = Field(default_factory=list)
    sections: list[RequirementSection] = Field(default_factory=list)
    workflow: RequirementWorkflow | None = None
    constraints: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class ComponentRecommendation(StrictModel):
    name: str = Field(min_length=1)
    reason: str = Field(min_length=1)
    priority: RecommendationPriority
    usage: str = Field(min_length=1)


class ReferenceSnippet(StrictModel):
    component: str | None = None
    type: str | None = None
    title: str | None = None
    summary: str = Field(min_length=1)


class GenerationPlanSection(StrictModel):
    kind: RequirementSectionKind
    title: str = Field(min_length=1)
    required: bool
    layout: str | None = None
    goals: list[str] = Field(default_factory=list)
    recommended_components: list[ComponentRecommendation] = Field(default_factory=list)
    reference_snippets: list[ReferenceSnippet] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class GenerationPlan(StrictModel):
    page_type: PageType
    summary: str = Field(min_length=1)
    user_goal: str = Field(min_length=1)
    sections: list[GenerationPlanSection] = Field(default_factory=list)
    global_constraints: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
