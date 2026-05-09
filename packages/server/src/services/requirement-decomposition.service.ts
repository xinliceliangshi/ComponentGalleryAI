import { includesAny } from "./requirement-decomposition/matchers.js";
import { matchRequirementPageProfile } from "./requirement-decomposition/page-profiles/index.js";
import type {
  IntentRule,
  RequirementDecomposition,
  RequirementSubtask
} from "./requirement-decomposition/types.js";

export type {
  RequirementDecomposition,
  RequirementSubtask,
  RequirementSubtaskPriority
} from "./requirement-decomposition/types.js";

const COMPLEX_CONNECTORS = ["包含", "支持", "同时", "以及", "并且", "需要", "还要", "包括", "实现", "带有", "具备"];

function normalizeInput(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function buildSummary(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}...` : text;
}

function toSubtask(rule: IntentRule): RequirementSubtask {
  return {
    id: rule.id,
    title: rule.title,
    intent: rule.intent,
    priority: rule.priority,
    uiRegion: rule.uiRegion,
    dataNeeds: rule.dataNeeds ?? [],
    interactionNeeds: rule.interactionNeeds ?? [],
    candidateKeywords: rule.candidateKeywords
  };
}

function shouldEnableDecomposition(text: string, matchedIntentCount: number): boolean {
  const connectorCount = COMPLEX_CONNECTORS.filter((word) => text.includes(word)).length;
  return text.length > 80 || connectorCount >= 2 || matchedIntentCount >= 3;
}

export function decomposeRequirement(input: string): RequirementDecomposition {
  const text = normalizeInput(input);
  const profile = matchRequirementPageProfile(text);
  const matchedRules = profile.rules.filter((rule) => includesAny(text, rule.terms));
  const enabled = profile.pageType === "admin-home-dashboard" || shouldEnableDecomposition(text, matchedRules.length);
  const subtasks = matchedRules.map(toSubtask);

  if (enabled && subtasks.length === 0) {
    subtasks.push({
      id: "main-ui",
      title: "主要界面",
      intent: "general-ui",
      priority: "must",
      dataNeeds: [],
      interactionNeeds: [],
      candidateKeywords: [text]
    });
  }

  return {
    enabled,
    summary: buildSummary(text),
    pageType: profile.pageType,
    userGoal: text,
    subtasks,
    constraints: enabled ? profile.constraints : [],
    risks: enabled ? ["原始需求较大，直接生成容易遗漏局部模块或交互"] : []
  };
}

export function buildDecompositionQueries(input: string, decomposition: RequirementDecomposition): string[] {
  if (!decomposition.enabled) return [input];

  const queries = [
    input,
    decomposition.summary,
    ...decomposition.subtasks.map((task) =>
      [task.title, task.intent, ...task.candidateKeywords].filter(Boolean).join(" ")
    )
  ];

  return Array.from(new Set(queries.map((query) => query.trim()).filter(Boolean)));
}
