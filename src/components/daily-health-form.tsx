"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, ClipboardPlus } from "lucide-react";
import {
  checkInInputSchema,
  moods,
  symptoms,
  type HealthCheckIn,
} from "@/lib/health/validation";
import { displayDate, displayTimestamp } from "@/lib/health/dates";
import { useHealth } from "./health-provider";
import { Button } from "./ui/button";
import { useInsights } from "./insights-provider";

const vitalFields = [
  {
    name: "heartRate",
    label: "Resting heart rate",
    unit: "bpm",
    min: 1,
    max: 350,
    step: 1,
  },
  {
    name: "systolic",
    label: "Systolic blood pressure",
    unit: "mmHg",
    min: 1,
    max: 400,
    step: 1,
  },
  {
    name: "diastolic",
    label: "Diastolic blood pressure",
    unit: "mmHg",
    min: 1,
    max: 300,
    step: 1,
  },
  {
    name: "temperature",
    label: "Body temperature",
    unit: "°C",
    min: 20,
    max: 50,
    step: "any",
  },
  {
    name: "spo2",
    label: "Blood oxygen saturation (SpO₂)",
    unit: "%",
    min: 1,
    max: 100,
    step: "any",
    optional: true,
  },
  {
    name: "glucose",
    label: "Blood glucose",
    unit: "mg/dL",
    min: 1,
    max: 2000,
    step: "any",
    optional: true,
  },
] as const;
const wellnessFields = [
  {
    name: "sleep",
    label: "Sleep duration",
    unit: "hours",
    min: 0,
    max: 24,
    step: "any",
  },
  {
    name: "exercise",
    label: "Exercise duration",
    unit: "minutes",
    min: 0,
    max: 1440,
    step: 1,
  },
  {
    name: "water",
    label: "Water intake",
    unit: "liters",
    min: 0,
    max: 30,
    step: "any",
    optional: true,
  },
] as const;
type NumberField = {
  name: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number | string;
  optional?: boolean;
};
const numberGuidance: Record<string, { help: string; example: string }> = {
  heartRate: {
    help: "Enter your resting pulse in beats per minute. Nothing is measured automatically.",
    example: "e.g. 72",
  },
  systolic: {
    help: "Enter the top number from your blood-pressure reading.",
    example: "e.g. 120",
  },
  diastolic: {
    help: "Enter the bottom number from the same blood-pressure reading.",
    example: "e.g. 80",
  },
  temperature: {
    help: "Enter the temperature measured using your thermometer, in degrees Celsius.",
    example: "e.g. 36.8",
  },
  spo2: {
    help: "Enter the oxygen saturation reading from your pulse oximeter. Use 1–100%, or leave blank if not measured. Zero is not accepted; this is an input rule, not a medical reference range.",
    example: "e.g. 98",
  },
  glucose: {
    help: "If measured, enter blood glucose in mg/dL. Otherwise leave blank; do not enter zero for a missing reading.",
    example: "e.g. 95",
  },
  sleep: {
    help: "How many hours did you sleep during your last sleep period? Decimals are welcome; 4.5 means four and a half hours.",
    example: "e.g. 7.5",
  },
  exercise: {
    help: "How many minutes did you exercise during this mission day? Enter 0 if none.",
    example: "e.g. 45",
  },
  water: {
    help: "If you tracked water, enter liters for this mission day. Leave blank if unknown; 0 means you recorded none.",
    example: "e.g. 2.0",
  },
};
const fieldLabels: Record<string, string> = Object.fromEntries(
  [...vitalFields, ...wellnessFields].map((field) => [field.name, field.label]),
);
Object.assign(fieldLabels, {
  missionDate: "Mission date",
  mood: "Mood",
  fatigue: "Fatigue level",
  notes: "Notes",
});
export function DailyHealthForm() {
  const { select } = useInsights();
  const { save, today } = useHealth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<HealthCheckIn | null>(null);
  const [version, setVersion] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const inFlight = useRef(false);
  const submissionId = useRef<string | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  function focusErrors() {
    requestAnimationFrame(() => summary.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || saved) return;
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const result = checkInInputSchema.safeParse({
      ...values,
      symptoms: form.getAll("symptoms"),
      notes: form.get("notes") ?? "",
      urgentSymptomReported: form.get("urgentSymptomReported") === "on",
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const name = String(issue.path[0] ?? "form");
        next[name] ??= issue.message;
      });
      setErrors(next);
      focusErrors();
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setErrors({});
    try {
      submissionId.current ??= crypto.randomUUID();
      const record = await save(result.data, submissionId.current);
      setSaved(record);
      requestAnimationFrame(() =>
        document.getElementById("save-confirmation")?.focus(),
      );
    } catch {
      setErrors({
        form: "Your check-in could not be saved, but your entries are still here. Allow this site to save information in this browser, check available space, then try again. Retrying Save will not create a duplicate.",
      });
      focusErrors();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function newCheckIn() {
    submissionId.current = null;
    setSaved(null);
    setErrors({});
    setVersion((v) => v + 1);
    setUrgent(false);
    requestAnimationFrame(() =>
      document.getElementById("missionDate")?.focus(),
    );
  }
  function numberField(field: NumberField) {
    const guidance = numberGuidance[field.name];
    return (
      <div className="form-field" key={field.name}>
        <label htmlFor={field.name}>
          {field.label}{" "}
          <span>{field.optional ? "(optional)" : "(required)"}</span>
        </label>
        <div className="input-unit">
          <input
            id={field.name}
            name={field.name}
            type="number"
            inputMode={field.step === 1 ? "numeric" : "decimal"}
            min={field.min}
            max={field.max}
            step={field.step}
            placeholder={guidance.example}
            required={!field.optional}
            onBlur={(event) => {
              const schema =
                checkInInputSchema.shape[
                  field.name as keyof typeof checkInInputSchema.shape
                ];
              const result = schema.safeParse(event.target.value);
              setErrors((current) => {
                const next = { ...current };
                if (result.success) delete next[field.name];
                else
                  next[field.name] =
                    result.error.issues[0]?.message ?? "Check this entry.";
                return next;
              });
            }}
            aria-invalid={!!errors[field.name]}
            aria-describedby={`${field.name}-help${errors[field.name] ? ` ${field.name}-error` : ""}`}
          />
          <span>{field.unit}</span>
        </div>
        <p className="input-help" id={`${field.name}-help`}>
          {guidance.help}
        </p>
        {errors[field.name] && (
          <p className="field-error" id={`${field.name}-error`}>
            {errors[field.name]}
          </p>
        )}
      </div>
    );
  }
  return (
    <>
      {saved && (
        <section
          className="save-confirmation"
          id="save-confirmation"
          tabIndex={-1}
          role="status"
        >
          <CheckCircle2 size={23} />
          <div>
            <h2>Demo check-in saved</h2>
            <p>
              Your check-in was added successfully. You can review it now or
              record another check-in when you are ready.
            </p>
            <p>
              Mission date: {displayDate(saved.missionDate)} · Recorded:{" "}
              {displayTimestamp(saved.recordedAt)}. History and dashboard now
              use this record.
            </p>
            <div className="inline-actions">
              <Button asChild size="sm">
                <Link href="/health-history">
                  View Health History
                  <ArrowRight size={14} />
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={newCheckIn}>
                Record another check-in
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/health-insights" onClick={() => select("saved")}>
                  View Health Insights
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className="health-form"
        key={version}
      >
        {!!Object.keys(errors).length && (
          <div
            ref={summary}
            className="validation-summary"
            tabIndex={-1}
            role="alert"
          >
            <h2>Check your entries</h2>
            <ul>
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>
                  {field === "form" ? (
                    message
                  ) : (
                    <a
                      href={`#${field}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(field)?.focus();
                      }}
                    >
                      {message}{" "}
                      <span>({fieldLabels[field] ?? "Check this field"})</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <fieldset disabled={busy || !!saved} className="form-fields">
          <legend className="sr-only">Daily health measurements</legend>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span className="metric-icon">
                <ClipboardPlus size={19} />
              </span>
              <div>
                <h2>Check-in details</h2>
                <p>
                  Fields labeled “required” must be filled in. SpO₂, glucose,
                  water and notes are optional. Leave an unmeasured optional
                  field blank; it will show “Not recorded.” Examples are
                  fictional, not medical targets.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="missionDate">
                  Mission-local date <span>(required)</span>
                </label>
                <input
                  id="missionDate"
                  name="missionDate"
                  type="date"
                  required
                  defaultValue={today}
                  aria-invalid={!!errors.missionDate}
                  aria-describedby="date-help missionDate-error"
                />
                <p id="date-help" className="input-help">
                  Mission calendar: UTC. The submission timestamp is saved
                  separately in UTC, even for an earlier selected date.
                </p>
                <p id="missionDate-error" className="field-error">
                  {errors.missionDate}
                </p>
              </div>
              <div className="form-context">
                <strong>Alex Morgan / AST-0042</strong>
                <p>
                  Fictional Asteria Expedition 07 crew member. Source:
                  user-entered demo. No medical device is connected.
                </p>
              </div>
            </div>
          </section>
          <section className="panel form-section">
            <h2>Vital signs</h2>
            <p className="form-section-description">
              Record values with the units shown. Data-entry limits are broad
              plausibility checks, not clinical reference ranges.
            </p>
            <div className="form-grid">{vitalFields.map(numberField)}</div>
          </section>
          <section className="panel form-section">
            <h2>Daily wellness</h2>
            <p className="form-section-description">
              Add context for the selected mission day.
            </p>
            <div className="form-grid">
              {wellnessFields.map(numberField)}
              <div className="form-field">
                <label htmlFor="mood">
                  Mood <span>(required)</span>
                </label>
                <select
                  id="mood"
                  name="mood"
                  defaultValue=""
                  required
                  aria-invalid={!!errors.mood}
                  aria-describedby={`mood-help${errors.mood ? " mood-error" : ""}`}
                >
                  <option value="" disabled>
                    Choose a mood
                  </option>
                  {moods.map((mood) => (
                    <option value={mood} key={mood}>
                      {mood[0].toUpperCase() + mood.slice(1)}
                    </option>
                  ))}
                </select>
                <p id="mood-help" className="input-help">
                  Choose the word that best describes how you felt this mission
                  day. This is a personal description, not a mental-health
                  assessment.
                </p>
                {errors.mood && (
                  <p className="field-error" id="mood-error">
                    {errors.mood}
                  </p>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="fatigue">
                  Fatigue level <span>(required)</span>
                </label>
                <select
                  id="fatigue"
                  name="fatigue"
                  defaultValue=""
                  required
                  aria-invalid={!!errors.fatigue}
                  aria-describedby="fatigue-help fatigue-error"
                >
                  <option value="" disabled>
                    Choose 0–10
                  </option>
                  {Array.from({ length: 11 }, (_, i) => (
                    <option value={i} key={i}>
                      {i}
                      {i === 0
                        ? " — no fatigue"
                        : i === 10
                          ? " — most fatigued"
                          : ""}
                    </option>
                  ))}
                </select>
                <p className="input-help" id="fatigue-help">
                  Personal rating: 0 = no fatigue, 10 = most fatigued.
                </p>
                <p className="field-error" id="fatigue-error">
                  {errors.fatigue}
                </p>
              </div>
            </div>
          </section>
          <section className="panel form-section">
            <h2>Symptoms & notes</h2>
            <label className="urgent-report-control">
              <input
                type="checkbox"
                name="urgentSymptomReported"
                checked={urgent}
                onChange={(event) => setUrgent(event.target.checked)}
              />
              I am reporting an urgent symptom and need immediate assessment
            </label>
            <p className="input-help">
              This is your explicit urgency report. Notes and symptom names are
              not automatically screened for emergencies. A saved urgent flag
              remains visible; this prototype does not track its resolution.
            </p>
            {urgent && (
              <div className="urgent-banner" role="alert">
                <strong>
                  Seek immediate assessment through the crew’s established
                  medical emergency procedure.
                </strong>
                <p>
                  Do not wait to complete this form. No approved medical
                  escalation protocol is configured in MissionPulse; it does not
                  provide treatment instructions.
                </p>
              </div>
            )}
            <fieldset className="symptoms-fieldset">
              <legend>Select any symptoms that apply (optional)</legend>
              <p className="input-help">
                Leave unchecked if there are none to report. Add details for
                “Other” in notes if useful.
              </p>
              <div className="symptom-options">
                {symptoms.map((symptom) => (
                  <label key={symptom}>
                    <input type="checkbox" name="symptoms" value={symptom} />
                    {symptom}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-field">
              <label htmlFor="notes">
                Notes <span>(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                maxLength={2000}
                placeholder="e.g. Fictional demo: sleep was interrupted by a schedule change."
                aria-invalid={!!errors.notes}
                aria-describedby="notes-help notes-error"
              />
              <p id="notes-help" className="input-help">
                Up to 2,000 characters. Use fictional context; do not enter
                personal medical information.
              </p>
              <p id="notes-error" className="field-error">
                {errors.notes}
              </p>
            </div>
          </section>
          <div className="form-save">
            <p>
              This saves to this browser only. It does not assess your health.
            </p>
            <Button type="submit" disabled={busy || !!saved}>
              {busy
                ? "Saving check-in…"
                : saved
                  ? "Check-in saved"
                  : "Save demo check-in"}
            </Button>
          </div>
        </fieldset>
      </form>
    </>
  );
}
