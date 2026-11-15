import { describe, expect, it, vi } from "vitest";
import { answerLocally } from "../src/lib/assistant/answers";
import {
  normalizeQuestion,
  relevantTopicIds,
  resolveFollowUp,
} from "../src/lib/assistant/intent";
import { makeHealthShare } from "../src/lib/assistant/context";
import { respond } from "../src/lib/assistant/service";
import { answerSchema, type ChatMessage } from "../src/lib/assistant/types";
import { createScenarioDataset } from "../src/lib/insights/scenarios";
const asOf = "2026-11-14T18:00:00.000Z";
const records = createScenarioDataset("sleep-fatigue", asOf);
const ask = (question: string, useRecords = false, rows = records) =>
  answerLocally({
    question,
    records: rows,
    dataset: "sleep-fatigue",
    asOf,
    minBaseline: 5,
    useRecords,
  });
const text = (question: string) =>
  ask(question)
    .sections.map((section) => section.text)
    .join(" ");
const history = (question: string, useRecords = false): ChatMessage[] => [
  {
    id: crypto.randomUUID(),
    role: "user",
    dataset: "sleep-fatigue",
    timestamp: asOf,
    text: question,
  },
  {
    id: crypto.randomUUID(),
    role: "assistant",
    dataset: "sleep-fatigue",
    timestamp: asOf,
    answer: ask(question, useRecords),
  },
];

describe("focused assistant relevance and privacy", () => {
  it.each([
    "Why my fatigue?",
    "Why am I tired?",
    "Why am I feeling fatiuge?",
    "Why my fatique?",
  ])("answers fatigue directly without guessing a cause: %s", (question) => {
    const answer = ask(question);
    expect(answer.sections[0].text).toContain("several contributing factors");
    expect(answer.sections[0].text).toContain("cannot tell why");
    expect(answer.sections[0].text).toContain("with consent");
    expect(answer.sources.map((source) => source.id)).toEqual(["sleep"]);
    expect(
      answer.sections.some((section) => section.kind === "observation"),
    ).toBe(false);
    expect(answerSchema.safeParse(answer).success).toBe(true);
  });
  it.each([
    "What should I record if I feel dizzy?",
    "What information should I record if I feel dizzy?",
    "What should I record if I feel dizy?",
  ])(
    "gives practical recording prompts before vestibular context: %s",
    (question) => {
      const answer = ask(question);
      expect(answer.category).toBe("education");
      expect(answer.sections[0].text).toMatch(
        /when.*began.*how long.*what you were doing.*accompanying symptoms/,
      );
      expect(answer.sections[0].text).toContain(
        "Do not delay established crew medical procedures",
      );
      expect(answer.sources.map((source) => source.id)).toEqual(["vestibular"]);
      expect(JSON.stringify(answer)).not.toMatch(
        /radiation|hostile environments/i,
      );
    },
  );
  it.each([
    [
      "What does NASA say about cardiovascular changes?",
      "cardiovascular",
      "circulation",
    ],
    ["Why can microgravity affect bones?", "bone-muscle", "reduced loading"],
    ["What about hydraton?", "nutrition", "cannot assess hydration"],
    ["Explain blood presure", "cardiovascular", "systolic and diastolic"],
    ["Why does excercise matter in space?", "exercise", "countermeasures"],
    [
      "What does NASA research about mood and stess?",
      "behavioral",
      "not a mental-health diagnosis",
    ],
    ["What is NASA space health research for?", "space-research", "deep-space"],
  ])("recognizes supported questions: %s", (question, id, expected) => {
    const answer = ask(question);
    expect(answer.sources.map((source) => source.id)).toEqual([id]);
    expect(answer.sections[0].text).toContain(expected);
  });
  it.each([
    "What is the weather on Mars?",
    "Explain quasar algebra",
    "How do I cook pasta?",
    "Tell me more",
    "What should I do about it?",
  ])("admits insufficient context/evidence: %s", (question) => {
    expect(ask(question).category).toBe("unsupported");
    expect(ask(question).sources).toEqual([]);
  });
  it("does not inspect records, including saved urgent flags, without consent", () => {
    const unreadable = new Proxy(records, {
      get() {
        throw Error("Measurement access without consent");
      },
    });
    for (const question of [
      "Why my fatigue?",
      "Has my sleep decreased?",
      "Which measurements are missing?",
      "Explain dizziness",
      "I have chest pain",
    ]) {
      expect(() => ask(question, false, unreadable)).not.toThrow();
    }
    expect(ask("Has my sleep decreased?").sections[0].id).toBe(
      "consent-required",
    );
    expect(ask("Which measurements are missing?").sections[0].id).toBe(
      "consent-required",
    );
  });
  it("preserves exact seven-date calculations and does not mutate records", () => {
    const before = JSON.stringify(records);
    const answer = ask("How has my sleep changed over seven days?", true);
    const points = records.filter((row) => row.missionDate >= "2026-11-08");
    const mean =
      points.reduce((sum, row) => sum + row.sleep!, 0) / points.length;
    const section = answer.sections.find(
      (section) => section.id === "recorded-sleep",
    )!;
    expect(section.text).toContain(
      `Arithmetic mean: ${Number(mean.toFixed(1))} hours (n=7)`,
    );
    expect(section.text).toContain("First-to-last recorded change:");
    expect(JSON.stringify(records)).toBe(before);
  });
  it("handles no data and missing measurements without inventing readings", () => {
    expect(
      ask("How has my sleep changed over seven days?", true, []).sections[0]
        .text,
    ).toContain("Not recorded");
    expect(
      ask("Which measurements are missing?", true, []).sections[0].text,
    ).toContain("0 of 63");
    const answer = ask("Why my fatigue?", true, []);
    expect(
      answer.sections.find((section) => section.id === "no-observation")?.text,
    ).toContain("No supported current observation");
  });
  it("resolves local follow-ups without reusing consent or raw prior text", () => {
    const question =
      "How has my sleep changed over seven days? PRIVATE NOTE SENTINEL";
    const messages = history(question, true);
    const resolved = resolveFollowUp("And over thirty days?", messages);
    expect(resolved).toContain("my selected demo sleep");
    expect(resolved).not.toContain("PRIVATE NOTE");
    const answer = ask(resolved);
    expect(answer.sections[0].id).toBe("consent-required");
    const approved = ask(resolved, true);
    expect(
      approved.sections.find((section) => section.id === "recorded-sleep")
        ?.text,
    ).toContain("16 Oct 2026");
    expect(
      resolveFollowUp(
        "Tell me more",
        history("Explain cardiovascular changes"),
      ),
    ).toContain("cardiovascular");
    expect(
      ask(
        resolveFollowUp(
          "Tell me more",
          history("What does NASA say about cardiovascular changes?"),
        ),
      ).category,
    ).toBe("education");
    expect(resolveFollowUp("What about dizziness?", messages)).toBe(
      "What about dizziness?",
    );
    expect(resolveFollowUp("Tell me more", [])).toBe("Tell me more");
    expect(resolveFollowUp("Tell me more", history("I have chest pain"))).toBe(
      "Tell me more",
    );
  });
  it("caps citations at two relevant known entries even for broad questions", () => {
    const answer = ask(
      "Explain heart sleep muscle bone radiation immune research",
    );
    expect(answer.sources).toHaveLength(2);
    expect(answerSchema.safeParse(answer).success).toBe(true);
    expect(relevantTopicIds("feel dizzy while recording information")).toEqual([
      "vestibular",
    ]);
    expect(normalizeQuestion("I'm tirred")).toContain("tired");
  });
  it("does not invent diagnoses in symptom explanations", () => {
    expect(text("Why am I tired?")).not.toMatch(
      /you (?:have|are suffering from)|diagnosed with/i,
    );
    expect(text("Why am I dizzy?")).toContain("cannot identify yours");
    expect(ask("Diagnose why I am tired").category).toBe("safety");
  });
  it("keeps unsupported hydration record analysis honest", () => {
    expect(
      ask("How has my water intake changed?", true).sections.some(
        (section) => section.kind === "recorded",
      ),
    ).toBe(false);
  });
});

describe("provider relevance and safe fallback", () => {
  it("keeps the direct answer ahead of consented observations in live selection mode", async () => {
    const health = makeHealthShare(
      "my sleep",
      records,
      "sleep-fatigue",
      asOf,
      5,
    );
    const answer = await respond(
      {
        question: "Explain my sleep baseline",
        useLive: true,
        healthConsent: true,
        health,
      },
      {
        configured: true,
        budget: async () => true,
        complete: async () =>
          JSON.stringify({ statementIds: ["knowledge-sleep"] }),
      },
    );
    expect(answer.mode).toBe("groq");
    expect(answer.sections[0].id).toBe("knowledge-sleep");
    expect(
      answer.sections.some((section) => section.kind === "observation"),
    ).toBe(true);
  });
  const request = {
    question:
      "Explain cardiovascular changes. Identity PRIVATE SENTINEL; heart rate 72 bpm; symptoms dizzy; notes PRIVATE NOTE",
    useLive: true,
    healthConsent: false,
  };
  it("sends only bounded topic labels and approved content, never raw questions", async () => {
    const complete = vi.fn(async () =>
      JSON.stringify({ statementIds: ["knowledge-vestibular"] }),
    );
    const answer = await respond(request, {
      configured: true,
      budget: async () => true,
      complete,
    });
    const payload = JSON.stringify(complete.mock.calls);
    expect(payload).not.toContain("PRIVATE");
    expect(payload).not.toContain("72");
    expect(payload).not.toContain("symptoms dizzy");
    expect(payload).not.toContain("missionDate");
    expect(answer.mode).toBe("groq");
    expect(answer.sources).toHaveLength(1);
  });
  it("rejects unrelated IDs and cannot drop the direct primary answer", async () => {
    for (const statementIds of [
      ["knowledge-radiation"],
      ["knowledge-cardiovascular"],
    ]) {
      const answer = await respond(
        { ...request, question: "Explain sleep and heart rate research" },
        {
          configured: true,
          budget: async () => true,
          complete: async () => JSON.stringify({ statementIds }),
        },
      );
      expect(answer.mode).toBe("local");
      expect(answer.reason).toBe("malformed");
      expect(answer.sections[0].sourceIds).toEqual(["sleep"]);
    }
  });
  it("preserves consented deterministic observations if Groq is unavailable", async () => {
    const health = makeHealthShare(
      "my sleep",
      records,
      "sleep-fatigue",
      asOf,
      5,
    );
    const complete = vi.fn();
    const answer = await respond(
      {
        question: "Explain my sleep baseline",
        useLive: true,
        healthConsent: true,
        health,
      },
      { configured: false, budget: async () => true, complete },
    );
    expect(answer.reason).toBe("unconfigured");
    expect(
      answer.sections.some((section) => section.kind === "observation"),
    ).toBe(true);
    expect(complete).not.toHaveBeenCalled();
  });
});
