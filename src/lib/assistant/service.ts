import { answerLocally } from "./answers";
import { expandHealthShare } from "./context";
import {
  modelPlanSchema,
  type AssistantRequest,
  type AssistantAnswer,
} from "./types";
export type ProviderDependencies = {
  configured: boolean;
  budget: () => Promise<boolean>;
  complete: (
    question: string,
    statements: { id: string; text: string }[],
  ) => Promise<string>;
};
export async function respond(
  input: AssistantRequest,
  deps: ProviderDependencies,
): Promise<AssistantAnswer> {
  const health = input.healthConsent ? input.health : undefined;
  const base = answerLocally({
    question: input.question,
    dataset: health?.dataset ?? "saved",
    records: health ? expandHealthShare(health) : [],
    asOf: health?.asOf ?? new Date().toISOString(),
    minBaseline: health?.minBaseline ?? 5,
    useRecords: !!health,
    urgentReported: health?.urgentReported,
  });
  // Safety and exact arithmetic never depend on a provider, budget or network.
  if (
    base.category === "safety" ||
    base.category === "records" ||
    !input.useLive ||
    base.category === "unsupported"
  )
    return base;
  if (!deps.configured) return { ...base, reason: "unconfigured" };
  if (base.category === "explanation" && !health) return base;
  const candidates = base.sections.filter(
    (section) => section.kind === "education",
  );
  if (!candidates.length) return base;
  try {
    if (!(await deps.budget())) return { ...base, reason: "budget" };
  } catch {
    return { ...base, reason: "budget-unavailable" };
  }
  try {
    const raw = await deps.complete(
      input.question,
      candidates.map((section) => ({ id: section.id, text: section.text })),
    );
    const plan = modelPlanSchema.safeParse(JSON.parse(raw));
    if (
      !plan.success ||
      new Set(plan.data.statementIds).size !== plan.data.statementIds.length ||
      plan.data.statementIds.some(
        (id) => !candidates.some((section) => section.id === id),
      )
    )
      return { ...base, reason: "malformed" };
    const selected = plan.data.statementIds.map((id) =>
      candidates.find((section) => section.id === id)!,
    );
    const sections = [
      ...base.sections.filter((section) => section.kind !== "education"),
      ...selected,
    ];
    return {
      ...base,
      mode: "groq",
      sections,
      sources: base.sources.filter((source) =>
        sections.some((section) => section.sourceIds.includes(source.id)),
      ),
      limitations: base.limitations
        .filter((text) => !text.startsWith("Local deterministic"))
        .concat(
          "Groq selected approved curated statements. Recorded values and Phase 3 observations are calculated deterministically; model-written prose is not displayed.",
        ),
    };
  } catch (error) {
    return {
      ...base,
      reason:
        error instanceof SyntaxError
          ? "malformed"
          : error instanceof Error &&
              /timeout|abort/i.test(error.name + " " + error.message)
            ? "timeout"
            : "provider-error",
    };
  }
}
