import type { Chunk, ToolCard } from "./component-knowledge/types.js";
import type { SectionKnowledge } from "./component-knowledge.service.js";
import type {
  RequirementDecomposition,
  RequirementSection
} from "./requirement-decomposition.service.js";
import type { RequirementSectionKind } from "./requirement-decomposition/types.js";
import { SECTION_COMPONENT_POLICY } from "./generation-plan/section-component-policy.js";

export type RecommendedComponent = {
  name: string;
  reason: string;
  priority: "high" | "medium" | "low";
  usage: string;
};

export type GenerationPlanSection = {
  kind: RequirementSectionKind;
  title: string;
  required: boolean;
  layout?: string;
  goals: string[];
  recommendedComponents: RecommendedComponent[];
  referenceSnippets: ReferenceSnippet[];
  notes?: string[];
};

export type ReferenceSnippet = {
  component?: string;
  type?: string;
  title?: string;
  summary: string;
};

export type GenerationPlan = {
  pageType: string;
  summary: string;
  userGoal: string;
  sections: GenerationPlanSection[];
  globalConstraints: string[];
  risks: string[];
};

function pickRecommendedComponents(
  section: RequirementSection,
  cards: ToolCard[],
  sectionKnowledge?: SectionKnowledge
): RecommendedComponent[] {
  const policy = SECTION_COMPONENT_POLICY[section.kind];
  const pageCardMap = new Map(cards.map((card) => [card.id, card]));
  const sectionCardMap = new Map((sectionKnowledge?.cards ?? []).map((card) => [card.id, card]));
  const recommendations: RecommendedComponent[] = [];

  const buildUsage = (card: ToolCard | undefined, fallbackReason: string): string => {
    const text = [card?.whenToUse, card?.summary, card?.importHint].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!text) return fallbackReason;
    return text.length > 90 ? `${text.slice(0, 90)}...` : text;
  };

  for (const preferred of policy.preferredComponents) {
    const matchedCard = sectionCardMap.get(preferred.name) ?? pageCardMap.get(preferred.name);
    if (!matchedCard) continue;
    recommendations.push({
      ...preferred,
      usage: buildUsage(matchedCard, preferred.reason)
    });
  }

  if (recommendations.length === 0) {
    recommendations.push(
      ...policy.preferredComponents.slice(0, 2).map((preferred) => ({
        ...preferred,
        usage: preferred.reason
      }))
    );
  }

  return recommendations.slice(0, 3);
}

function summarizeChunkText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 100 ? `${normalized.slice(0, 100)}...` : normalized;
}

function pickReferenceSnippets(sectionKnowledge?: SectionKnowledge): ReferenceSnippet[] {
  return (sectionKnowledge?.chunks ?? [])
    .slice(0, 3)
    .map((chunk: Chunk) => ({
      component: chunk.component,
      type: chunk.type,
      title: chunk.title,
      summary: summarizeChunkText(chunk.text)
    }))
    .filter((snippet) => snippet.summary);
}

function buildPlanSection(
  section: RequirementSection,
  cards: ToolCard[],
  sectionKnowledge?: SectionKnowledge
): GenerationPlanSection {
  const policy = SECTION_COMPONENT_POLICY[section.kind];

  return {
    kind: section.kind,
    title: policy.title,
    required: section.required,
    layout: section.layout,
    goals: policy.goals,
    recommendedComponents: pickRecommendedComponents(section, cards, sectionKnowledge),
    referenceSnippets: pickReferenceSnippets(sectionKnowledge),
    notes: policy.notes
  };
}

export function buildGenerationPlan(
  decomposition: RequirementDecomposition,
  knowledge: { cards: ToolCard[]; sectionKnowledge?: SectionKnowledge[] }
): GenerationPlan | undefined {
  if (!decomposition.enabled) return undefined;

  const sectionKnowledgeMap = new Map(
    (knowledge.sectionKnowledge ?? []).map((entry) => [entry.section.kind, entry])
  );

  return {
    pageType: decomposition.pageType,
    summary: decomposition.summary,
    userGoal: decomposition.userGoal,
    sections: (decomposition.sections ?? []).map((section) =>
      buildPlanSection(section, knowledge.cards, sectionKnowledgeMap.get(section.kind))
    ),
    globalConstraints: decomposition.constraints,
    risks: decomposition.risks
  };
}
