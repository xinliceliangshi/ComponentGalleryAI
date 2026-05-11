import type {
  RequirementPageProfile,
  RequirementSection,
  RequirementSectionBlueprint,
  RequirementSubtask
} from "./types.js";

function shouldIncludeBlueprint(
  blueprint: RequirementSectionBlueprint,
  matchedSubtaskIds: Set<string>
): boolean {
  if (blueprint.required) return true;

  const when = blueprint.when ?? "matched-subtask";
  if (when === "always" || when === "page-type") return true;

  return (blueprint.sourceSubtaskIds ?? []).some((id) => matchedSubtaskIds.has(id));
}

function toSection(
  blueprint: RequirementSectionBlueprint,
  matchedSubtaskIds: Set<string>
): RequirementSection {
  const sourceSubtaskId = (blueprint.sourceSubtaskIds ?? []).find((id) => matchedSubtaskIds.has(id))
    ?? blueprint.sourceSubtaskIds?.[0];

  return {
    kind: blueprint.kind,
    required: blueprint.required,
    priority: blueprint.priority,
    layout: blueprint.layout,
    intent: blueprint.intent,
    uiRegion: blueprint.uiRegion,
    sourceSubtaskId
  };
}

export function buildSections(
  profile: RequirementPageProfile,
  subtasks: RequirementSubtask[]
): RequirementSection[] | undefined {
  if (!profile.sectionBlueprints?.length) return undefined;

  const matchedSubtaskIds = new Set(subtasks.map((subtask) => subtask.id));
  const sections = profile.sectionBlueprints
    .filter((blueprint) => shouldIncludeBlueprint(blueprint, matchedSubtaskIds))
    .map((blueprint) => toSection(blueprint, matchedSubtaskIds));

  return sections.length > 0 ? sections : undefined;
}
