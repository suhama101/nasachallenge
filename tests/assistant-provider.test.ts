import { afterEach, expect, it, vi } from "vitest";
const { create, constructor } = vi.hoisted(() => ({
  create: vi.fn(),
  constructor: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("groq-sdk", () => ({
  default: class MockGroq {
    chat = { completions: { create } };
    constructor(options: unknown) {
      constructor(options);
    }
  },
}));
import { providerDependencies } from "../src/lib/assistant/provider.server";
function configure() {
  for (const [key, value] of Object.entries({
    GROQ_LIVE_ENABLED: "true",
    GROQ_API_KEY: "test-placeholder",
    GROQ_MODEL: "test-configured-model",
    UPSTASH_REDIS_REST_URL: "https://budget.example",
    UPSTASH_REDIS_REST_TOKEN: "test-placeholder",
  }))
    vi.stubEnv(key, value);
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it("requires every private live configuration component", () => {
  configure();
  expect(providerDependencies().configured).toBe(true);
  vi.stubEnv("GROQ_MODEL", "");
  expect(providerDependencies().configured).toBe(false);
});
it("uses the official SDK interface with environment model, no retries, timeout and token limits", async () => {
  configure();
  create.mockResolvedValue({
    choices: [{ message: { content: '{"statementIds":["knowledge-sleep"]}' } }],
  });
  expect(
    await providerDependencies().complete("sleep", [
      { id: "knowledge-sleep", text: "Approved text" },
    ]),
  ).toContain("knowledge-sleep");
  expect(constructor).toHaveBeenCalledWith(
    expect.objectContaining({ maxRetries: 0, timeout: 8000, logLevel: "off" }),
  );
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      model: "test-configured-model",
      max_completion_tokens: 256,
      response_format: { type: "json_object" },
    }),
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  const messages = create.mock.calls[0][0].messages;
  expect(messages).toHaveLength(2);
  expect(JSON.parse(messages[1].content)).toEqual({
    question: "sleep",
    approvedStatements: [{ id: "knowledge-sleep", text: "Approved text" }],
  });
});
it("shares atomic time-bucket budgets with conservative caps and no visitor data", async () => {
  configure();
  vi.stubEnv("GROQ_REQUESTS_PER_MINUTE", "9999");
  vi.stubEnv("GROQ_REQUESTS_PER_DAY", "9999");
  const fetcher = vi.fn(async () => Response.json({ result: 1 }));
  vi.stubGlobal("fetch", fetcher);
  expect(await providerDependencies().budget()).toBe(true);
  const options = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  const command = JSON.parse(String(options[1].body));
  expect(command[0]).toBe("EVAL");
  expect(command.slice(-2)).toEqual(["20", "500"]);
  expect(command[3]).toMatch(/^missionpulse:minute:\d+$/);
  expect(command[4]).toMatch(/^missionpulse:day:\d+$/);
  expect(String(options[1].body)).not.toContain("question");
});
it("denies exhausted budgets and rejects failed or invalid responses", async () => {
  configure();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ result: 0 })),
  );
  expect(await providerDependencies().budget()).toBe(false);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ error: "unavailable" })),
  );
  await expect(providerDependencies().budget()).rejects.toThrow(
    "Budget unavailable",
  );
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "http://insecure.example");
  await expect(providerDependencies().budget()).rejects.toThrow(
    "Budget unavailable",
  );
});
