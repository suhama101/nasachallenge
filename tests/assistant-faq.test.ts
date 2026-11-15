import { describe, expect, it, vi } from "vitest";
import { answerLocally } from "../src/lib/assistant/answers";
import { assistantFaq } from "../src/lib/assistant/faq";
import { respond } from "../src/lib/assistant/service";
import { answerSchema } from "../src/lib/assistant/types";
import type { HealthCheckIn } from "../src/lib/health/validation";

const ask = (question: string, liveAvailable?: boolean) =>
  answerLocally({
    question,
    dataset: "saved",
    records: [],
    asOf: "2026-11-15T12:00:00Z",
    minBaseline: 5,
    useRecords: false,
    liveAvailable,
  });

describe("deterministic assistant introduction FAQ", () => {
  it("does not expand incoming measurement context for a FAQ even with consent", async () => {
    const input = new Proxy(
      {
        question: "Do you have access to my health records?",
        useLive: true,
        healthConsent: true,
      },
      {
        get(target, key, receiver) {
          if (key === "health") throw Error("FAQ accessed health payload");
          return Reflect.get(target, key, receiver);
        },
      },
    );
    const answer = await respond(input, {
      configured: true,
      budget: vi.fn(),
      complete: vi.fn(),
    });
    expect(answer.sections[0].id).toBe("faq-privacy");
  });
  it.each([
    ["Are we doing live chatting?", "faq-live"],
    ["Are you an AI?", "faq-identity"],
    ["Can you answer my questions?", "faq-capabilities"],
    ["What can you do?", "faq-capabilities"],
    ["Are you connected to NASA?", "faq-sources"],
    ["Do you have access to my health records?", "faq-privacy"],
    ["Are we doing live chating?", "faq-live"],
    ["r u an artifical inteligence?", "faq-identity"],
    ["Can u answer my questons?", "faq-capabilities"],
    ["What are your capabilites?", "faq-capabilities"],
    ["Are you conected to NASA?", "faq-sources"],
    ["Do you have acess to my helth recods?", "faq-privacy"],
    ["Can you see my personal cloud health records?", "faq-privacy"],
    ["Where do your sources come from?", "faq-sources"],
    ["Are you live chatting?", "faq-live"],
    ["Are you live chating with me?", "faq-live"],
    ["Are we chatting live?", "faq-live"],
    ["Are we doing live chatting?", "faq-live"],
    ["arewe doing live chating", "faq-live"],
    ["Are you a real AI?", "faq-identity"],
    ["What can you do?", "faq-capabilities"],
    ["AREYOU LIVE CHATING WITHME?!", "faq-live"],
    ["Are we chatting live with you right now?", "faq-live"],
  ])("answers %s locally", (question, id) => {
    const answer = ask(question);
    expect(answer.sections[0].id).toBe(id);
    expect(answer.mode).toBe("local");
    expect(answerSchema.safeParse(answer).success).toBe(true);
    expect(answer.sections[0].text).not.toContain(
      "No relevant curated evidence",
    );
  });
  it("describes availability without pretending that a FAQ reply used Groq", () => {
    for (const available of [true, false, undefined])
      expect(
        ask("Are we doing live chatting?", available).sections[0].text,
      ).toBe(
        "You are chatting with MissionPulse's local research assistant, not unrestricted live generative AI. I provide curated NASA/CSA educational answers and can review selected demo measurements with your permission.",
      );
    expect(ask("Are you an AI?", true).sections[0].text).toContain(
      "local curated response, not live generative AI",
    );
  });
  it("does not inspect measurements even when consent is checked for a FAQ", () => {
    const records = new Proxy([] as HealthCheckIn[], {
      get() {
        throw Error("FAQ read measurements");
      },
    });
    for (const useRecords of [false, true]) {
      const answer = answerLocally({
        question: "Do you have access to my health records?",
        dataset: "saved",
        records,
        asOf: "2026-11-15T12:00:00Z",
        minBaseline: 5,
        useRecords,
      });
      expect(answer.sections[0].id).toBe("faq-privacy");
      expect(answer.sections[0].text).toContain(
        "I have not read any measurements",
      );
      expect(answer.sections[0].text).toContain(
        "Consent is required again for each message",
      );
    }
  });
  it("explains public NASA/CSA sources without claiming official access", () => {
    const answer = ask("Are you connected to NASA?");
    expect(answer.sections[0].text).toContain(
      "not an official NASA medical assistant",
    );
    expect(answer.sections[0].text).toContain("not connected to NASA systems");
    expect(
      answer.sources.map((source) => new URL(source.url).hostname),
    ).toEqual(["www.nasa.gov", "www.asc-csa.gc.ca"]);
  });
  it.each([
    "Why my fatigue?",
    "What should I record if I feel dizzy?",
    "How has my sleep changed over seven days?",
    "Can you answer my questions about dizziness?",
    "Do you have access to another astronaut's records?",
    "Are you live chatting with me about my sleep?",
    "Are we chatting live about cardiovascular research?",
    "What does NASA say about live cell imaging?",
    "Are you a real AI that can diagnose my symptoms?",
  ])(
    "does not intercept health or private-profile requests: %s",
    (question) => {
      expect(assistantFaq(question)).toBeUndefined();
      expect(ask(question).sections[0].id).not.toMatch(/^faq-/);
    },
  );
  it("keeps safety ahead of introductions and leaves unsupported topics unsupported", () => {
    expect(ask("Are you an AI? I have chest pain").category).toBe("safety");
    expect(ask("Can you diagnose my condition?").category).toBe("safety");
    expect(ask("Explain quasar algebra").category).toBe("unsupported");
    expect(ask("Why my fatigue?").sources.map((source) => source.id)).toEqual([
      "sleep",
    ]);
    expect(
      ask("What should I record if I feel dizzy?").sources.map(
        (source) => source.id,
      ),
    ).toEqual(["vestibular"]);
  });
  it.each([false, true])(
    "does not call a provider or budget for FAQ replies (configured=%s)",
    async (configured) => {
      const complete = vi.fn(),
        budget = vi.fn();
      const answer = await respond(
        {
          question: "Are we doing live chatting?",
          useLive: true,
          healthConsent: false,
        },
        { configured, complete, budget },
      );
      expect(answer.sections[0].id).toBe("faq-live");
      expect(answer.mode).toBe("local");
      expect(answer.reason).toBe("local");
      expect(complete).not.toHaveBeenCalled();
      expect(budget).not.toHaveBeenCalled();
      expect(answer.sections[0].text).toContain(
        "local research assistant, not unrestricted live generative AI",
      );
    },
  );
});
