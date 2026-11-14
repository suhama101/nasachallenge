"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertDialog } from "radix-ui";
import { Send, ShieldCheck, Trash2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { useInsights } from "./insights-provider";
import { answerLocally, questionCategory } from "@/lib/assistant/answers";
import { makeHealthShare } from "@/lib/assistant/context";
import {
  answerSchema,
  type AssistantAnswer,
  type ChatMessage,
  type DatasetKey,
} from "@/lib/assistant/types";
import { clearChat, loadChat, saveChat } from "@/lib/assistant/storage";
const starters = [
  "How has my sleep changed over the last seven days?",
  "What does NASA say about cardiovascular changes in space?",
  "Why can microgravity affect bones and muscles?",
  "What information should I record if I feel dizzy?",
  "Which measurements are missing from my recent check-ins?",
];
const fallbackReasons: Partial<Record<AssistantAnswer["reason"], string>> = {
  unconfigured: "Live AI configuration is unavailable.",
  timeout: "The provider timed out.",
  "provider-error": "The provider could not respond.",
  malformed: "The provider returned an unsupported selection.",
  budget: "The shared live request budget has been reached. Try again later.",
  "budget-unavailable": "The live request budget could not be verified.",
  network: "The network request failed.",
};
export function AssistantWorkspace() {
  const { selection, select } = useInsights();
  return (
    <>
      <div className="panel assistant-dataset">
        <label className="form-field">
          <span>Assistant dataset · fictional demonstration only</span>
          <select
            value={selection}
            onChange={(event) => select(event.target.value as DatasetKey)}
          >
            <option value="saved">Saved browser demo · Alex Morgan</option>
            <option value="routine">Scenario A · stable routine</option>
            <option value="sleep-fatigue">Scenario B · sleep & fatigue</option>
            <option value="heart-rate">Scenario C · heart rate & sleep</option>
          </select>
        </label>
        <p>
          Separate local conversations for each dataset. Scenarios never
          overwrite saved check-ins.
        </p>
      </div>
      <Conversation key={selection} dataset={selection} />
    </>
  );
}
function Conversation({ dataset }: { dataset: DatasetKey }) {
  const { selectedRecords, options } = useInsights();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  const [live, setLive] = useState(false);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const sending = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    void loadChat(dataset)
      .then((rows) => {
        if (active) {
          setMessages(rows);
          setReady(true);
        }
      })
      .catch(() => {
        if (active)
          setStorageError(
            "Saved conversation could not be read or is inconsistent. It has not been overwritten. You can clear this dataset’s chat to recover; health check-ins are unaffected.",
          );
      });
    return () => {
      active = false;
      mounted.current = false;
      controller.current?.abort();
    };
  }, [dataset]);
  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/assistant", { signal: abort.signal })
      .then((response) => response.json())
      .then((status) => setAvailable(status.liveAvailable === true))
      .catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);
  async function persist(next: ChatMessage[]) {
    setMessages(next);
    try {
      await saveChat(dataset, next);
    } catch {
      setStorageError(
        "Chat is visible for this session but could not be saved. Check browser storage and retry, or clear this dataset’s conversation.",
      );
    }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || sending.current || !ready || storageError) return;
    sending.current = true;
    controller.current = new AbortController();
    setBusy(true);
    setError("");
    setQuestion("");
    const approved = consent;
    setConsent(false);
    const local = answerLocally({
      question: text,
      dataset,
      records: selectedRecords,
      asOf: options.asOf,
      minBaseline: options.minBaseline ?? 5,
      useRecords: approved,
    });
    const user: ChatMessage = {
      id: crypto.randomUUID(),
      dataset,
      role: "user",
      timestamp: new Date().toISOString(),
      text,
    };
    let answer = local;
    const next = [...messages, user].slice(-99);
    await persist(next);
    if (!mounted.current) return;
    if (
      live &&
      local.category !== "safety" &&
      local.category !== "records" &&
      local.category !== "unsupported" &&
      (questionCategory(text) === "education" || approved)
    ) {
      const timer = setTimeout(() => controller.current?.abort(), 16000);
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.current.signal,
          body: JSON.stringify({
            question: text,
            useLive: true,
            healthConsent: approved,
            health:
              approved && local.category === "explanation"
                ? makeHealthShare(
                    text,
                    selectedRecords,
                    dataset,
                    options.asOf,
                    options.minBaseline ?? 5,
                  )
                : undefined,
          }),
        });
        if (!response.ok) throw Error("Request declined");
        answer = answerSchema.parse(await response.json());
      } catch {
        if (!mounted.current) return;
        answer = { ...local, reason: "network" };
        setError(
          "Live request unavailable. A local grounded response is shown below.",
        );
      } finally {
        clearTimeout(timer);
      }
    }
    if (!mounted.current) return;
    if (controller.current.signal.aborted)
      answer = { ...local, reason: "timeout" };
    await persist(
      [
        ...next,
        {
          id: crypto.randomUUID(),
          dataset,
          role: "assistant" as const,
          timestamp: new Date().toISOString(),
          answer,
        },
      ].slice(-100),
    );
    sending.current = false;
    setBusy(false);
    input.current?.focus();
  }
  async function remove() {
    try {
      await clearChat(dataset);
      setMessages([]);
      setStorageError("");
      setReady(true);
      setClearOpen(false);
      setError("");
    } catch {
      setError("Conversation could not be cleared. No deletion is confirmed.");
    }
  }
  return (
    <div className="assistant-grid">
      <aside className="panel assistant-guide">
        <ShieldCheck size={24} />
        <h2>
          Grounded in research.
          <br />
          Bounded by safety.
        </h2>
        <p>
          No diagnosis, medication, clinical risk score or autonomous treatment.
          Contact your designated crew medical officer for medical concerns;
          follow established mission emergency procedures for urgent symptoms.
        </p>
        <p>
          <strong>
            {available
              ? "Live selection is available by choice."
              : "Local demo mode · live AI unavailable."}
          </strong>{" "}
          Exact values and statistical observations always use deterministic
          calculations. Groq can select approved educational statements; it
          cannot write new medical advice.
        </p>
        <Link href="/space-health-knowledge">
          Explore the research library →
        </Link>
        <h3>Start a conversation</h3>
        <div className="assistant-starters">
          {starters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => {
                setQuestion(starter);
                input.current?.focus();
              }}
              disabled={busy}
            >
              {starter}
            </button>
          ))}
        </div>
      </aside>
      <section
        className="panel assistant-chat"
        aria-label="Health assistant conversation"
      >
        <div className="assistant-chat-heading">
          <div>
            <h2>Your crew notebook</h2>
            <p>Local browser history · up to 100 messages</p>
          </div>
          <AlertDialog.Root open={clearOpen} onOpenChange={setClearOpen}>
            <AlertDialog.Trigger asChild>
              <Button variant="outline" disabled={busy}>
                <Trash2 size={15} />
                Clear conversation
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="dialog-overlay" />
              <AlertDialog.Content className="dialog-content">
                <AlertDialog.Title>Clear this conversation?</AlertDialog.Title>
                <AlertDialog.Description>
                  This deletes only the selected dataset’s local chat. Other
                  conversations and health check-ins stay saved.
                </AlertDialog.Description>
                <div className="dialog-actions">
                  <AlertDialog.Cancel asChild>
                    <Button variant="outline">Keep conversation</Button>
                  </AlertDialog.Cancel>
                  <Button onClick={() => void remove()}>
                    Delete conversation
                  </Button>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
        {storageError && (
          <p role="alert" className="field-error assistant-notice">
            {storageError}
          </p>
        )}
        <div
          className="assistant-log"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Messages"
        >
          {!messages.length && (
            <div className="assistant-welcome">
              <p className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p>
              <h3>What would you like to understand?</h3>
              <p>
                Ask about the research, a specific recorded value, or an
                explainable observation. Each question stands alone; previous
                turns stay in this browser.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <article
              className={`chat-message chat-${message.role}`}
              key={message.id}
            >
              <div className="chat-message-meta">
                <strong>
                  {message.role === "user"
                    ? "You"
                    : message.answer?.mode === "groq"
                      ? "Groq-assisted selection · curated statements"
                      : "MissionPulse · local grounded response"}
                </strong>
                <time dateTime={message.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              {message.text && <p>{message.text}</p>}
              {message.answer && <AnswerView answer={message.answer} />}
            </article>
          ))}
          {busy && <p role="status">Preparing a grounded response…</p>}
          <div ref={end} />
        </div>
        <form
          className="assistant-composer"
          onSubmit={(event) => void send(event)}
        >
          <div className="assistant-choices">
            <label>
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                disabled={busy}
              />
              Use selected demo measurements for this message
            </label>
            <label>
              <input
                type="checkbox"
                checked={live}
                onChange={(event) => setLive(event.target.checked)}
                disabled={!available || busy}
              />
              Use live Groq selection when relevant
            </label>
          </div>
          <p className="assistant-disclosure">
            {consent
              ? "Local record analysis approved for one message. If live selection is requested for an explanation, up to 31 relevant date/value demo rows and an urgent flag go to the MissionPulse server."
              : "Health measurements are excluded unless you opt in for this message."}{" "}
            Live requests send only your current question and up to 3 retrieved
            educational statements to Groq. Names, notes, symptoms, profile IDs,
            raw measurements and previous messages are never sent to Groq. Use
            fictional information only.
          </p>
          <label className="form-field" htmlFor="assistant-question">
            <span>Your question</span>
            <textarea
              ref={input}
              id="assistant-question"
              value={question}
              maxLength={1600}
              rows={3}
              placeholder="Ask about space-health research or your demo records…"
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
          </label>
          <div className="assistant-send">
            <small>
              {question.length}/1600 · Enter to send · Shift+Enter for a new
              line
            </small>
            <Button
              type="submit"
              disabled={!question.trim() || busy || !ready || !!storageError}
            >
              <Send size={15} />
              {busy ? "Preparing…" : "Send message"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
function AnswerView({ answer }: { answer: AssistantAnswer }) {
  return (
    <>
      <p className="chat-mode">
        {answer.mode === "groq"
          ? "Live selection of approved statements"
          : "Local deterministic / curated · not live AI"}
        {fallbackReasons[answer.reason] &&
          ` · ${fallbackReasons[answer.reason]} Grounded fallback used.`}
      </p>
      {answer.sections.map((section) => (
        <section
          key={section.id}
          className={`answer-section answer-${section.kind}`}
        >
          <h3>{section.title}</h3>
          <p>{section.text}</p>
          {section.sourceIds.map((id) => {
            const source = answer.sources.find((item) => item.id === id)!;
            return (
              <a
                key={id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-source"
              >
                <ExternalLink size={13} />
                {source.organization}: {source.title}
                <small>
                  v{source.version} · reviewed {source.verifiedOn}
                </small>
              </a>
            );
          })}
        </section>
      ))}
      <details>
        <summary>Limitations & safe next step</summary>
        {answer.limitations.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <p>{answer.nextStep}</p>
      </details>
    </>
  );
}
