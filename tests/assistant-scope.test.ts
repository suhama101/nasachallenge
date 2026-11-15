import { describe, expect, it, vi } from "vitest";
import { answerLocally } from "../src/lib/assistant/answers";
import {
  assistantFaq,
  unsupportedMedicalTopic,
} from "../src/lib/assistant/faq";
import { resolveFollowUp } from "../src/lib/assistant/intent";
import { respond } from "../src/lib/assistant/service";
import { answerSchema, type ChatMessage } from "../src/lib/assistant/types";
import type { HealthCheckIn } from "../src/lib/health/validation";

const ask = (question: string) =>
  answerLocally({
    question,
    dataset: "saved",
    records: [],
    asOf: "2026-11-15T12:00:00Z",
    minBaseline: 5,
    useRecords: false,
    liveAvailable: true,
  });

describe("conservative conversational clarification and scope", () => {
  it.each([
    "Are you doing chanting?",
    "Are we chanting?",
    "Can you do chanting?",
    "Are you doing chanting right now?",
    "chanting?",
    "What about chanting?",
  ])("asks instead of assuming: %s", (question) => {
    const answer = ask(question);
    expect(answer.sections[0].id).toBe("faq-clarify");
    expect(answer.sections[0].text).toMatch(/^Did you mean chatting\?/);
    expect(answer.sections[0].text).toContain("If you meant chanting");
    expect(answer.sections[0].text).toContain("not live generative AI");
    expect(answer.sections[0].text).not.toContain("currently available");
    expect(answer.sources).toEqual([]);
    expect(answer.mode).toBe("local");
    expect(answerSchema.safeParse(answer).success).toBe(true);
  });
  it.each([
    "Are you doing chattng?",
    "Are you doing chattingg?",
    "Can you chat with me?",
  ])("accepts bounded conversational variations: %s", (question) => {
    expect(ask(question).sections[0].id).toBe("faq-live");
  });
  it.each([
    "What can you help me with?",
    "What can I ask you?",
    "What topics can you help with?",
    "How are you?",
    "What are your capabilties?",
  ])("explains capabilities naturally: %s", (question) => {
    expect(ask(question).sections[0].id).toBe("faq-capabilities");
    expect(ask(question).sections[0].text).toContain(
      "explicit per-message consent",
    );
    expect(ask(question).sections[0].text).toContain("not live generative AI");
  });
  it.each([
    "Can sleep cure diabetes?",
    "Explain fatigue and cancer",
    "Why does my rash hurt?",
    "Can chanting improve my sleep?",
    "Does exercise help my arthritis?",
    "How can I treat fatigue?",
  ])(
    "does not substitute a loosely related research answer: %s",
    (question) => {
      const answer = ask(question);
      expect(answer.category).toBe("unsupported");
      expect(answer.sources).toEqual([]);
      expect(answer.sections[0].text).toContain(
        "cannot assess a medical condition or recommend treatment",
      );
      expect(answer.sections[0].text).toContain(
        "general sleep, fatigue, heart-rate",
      );
      expect(answer.nextStep).toContain("missing measurements");
    },
  );
  it("does not reinterpret real chanting questions as chatting", () => {
    expect(assistantFaq("What is chanting?")).toBeUndefined();
    expect(assistantFaq("Can chanting improve my sleep?")).toBeUndefined();
    expect(ask("What is chanting?").sections[0].text).not.toContain(
      "Did you mean chatting?",
    );
  });
  it("keeps record-handling and supported research distinct from treatment", () => {
    expect(
      unsupportedMedicalTopic("How do you treat missing measurements?"),
    ).toBe(false);
    expect(ask("How do you treat missing measurements?").sections[0].id).toBe(
      "consent-required",
    );
    expect(ask("Why my fatigue?").sources.map((source) => source.id)).toEqual([
      "sleep",
    ]);
    expect(
      ask("What should I record if I feel dizzy?").sources.map(
        (source) => source.id,
      ),
    ).toEqual(["vestibular"]);
    expect(
      ask("Why can microgravity affect bones?").sources.map(
        (source) => source.id,
      ),
    ).toEqual(["bone-muscle"]);
  });
  it("requires explicit confirmation immediately after its own clarification", () => {
    const messages: ChatMessage[] = [
      {
        id: crypto.randomUUID(),
        dataset: "saved",
        role: "assistant",
        timestamp: "2026-11-15T12:00:00Z",
        answer: ask("Are you doing chanting?"),
      },
    ];
    expect(resolveFollowUp("yes", messages)).toBe("Can we chat?");
    expect(ask(resolveFollowUp("yes", messages)).sections[0].id).toBe(
      "faq-live",
    );
    expect(resolveFollowUp("yes", [])).toBe("yes");
    expect(resolveFollowUp("no", messages)).toBe("no");
    expect(resolveFollowUp("Can chanting improve my sleep?", messages)).toBe(
      "Can chanting improve my sleep?",
    );
  });
  it("does not read selected measurements to clarify even when consent was checked", () => {
    const records = new Proxy([] as HealthCheckIn[], {
      get() {
        throw Error("Clarification inspected measurements");
      },
    });
    const answer = answerLocally({
      question: "Are you doing chanting?",
      dataset: "saved",
      records,
      asOf: "2026-11-15T12:00:00Z",
      minBaseline: 5,
      useRecords: true,
    });
    expect(answer.sections[0].id).toBe("faq-clarify");
  });
  it("leaves emergency and restricted medical requests on existing safety paths", () => {
    expect(ask("Are you doing chanting? I have chest pain").category).toBe(
      "safety",
    );
    const answer = ask("Diagnose my cancer and prescribe medication");
    expect(answer.category).toBe("safety");
    expect(answer.sections[0].text).toContain("cannot diagnose");
    expect(answer.nextStep).toContain("sleep, fatigue");
  });
  it.each([
    "Are you doing chanting?",
    "Can sleep cure diabetes?",
    "Explain quasar algebra",
  ])(
    "keeps clarification and unsupported replies local: %s",
    async (question) => {
      const complete = vi.fn(),
        budget = vi.fn();
      const answer = await respond(
        { question, useLive: true, healthConsent: false },
        { configured: true, complete, budget },
      );
      expect(answer.mode).toBe("local");
      expect(complete).not.toHaveBeenCalled();
      expect(budget).not.toHaveBeenCalled();
    },
  );
});
