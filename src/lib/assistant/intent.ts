import { getKnowledgeEntry } from "../knowledge/content";
import type { ChatMessage } from "./types";

// Deliberately bounded corrections, not fuzzy matches over medical vocabulary.
const spellings: Record<string, string> = {
  fatiuge: "fatigue",
  fatique: "fatigue",
  tirred: "tired",
  tiredness: "fatigue",
  sleap: "sleep",
  slepp: "sleep",
  slep: "sleep",
  heartrate: "heart rate",
  presure: "pressure",
  dizy: "dizzy",
  dizzyness: "dizziness",
  hydraton: "hydration",
  excercise: "exercise",
  excersise: "exercise",
  stess: "stress",
  measurments: "measurements",
  misssing: "missing",
};
export function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[’']/g, "'")
    .replace(/\b[a-z]+\b/g, (word) => spellings[word] ?? word);
}

const topics = [
  {
    id: "vestibular",
    match:
      /\b(dizzy|dizziness|vestibular|orientation|balance|nausea|sensorimotor)\b/,
  },
  {
    id: "sleep",
    match:
      /\b(sleep|slept|sleeping|fatigue|tired|exhausted|rest|circadian|schedule)\b/,
  },
  {
    id: "cardiovascular",
    match:
      /\b(heart|pulse|bpm|cardiac|cardiovascular|circulation|blood pressure|systolic|diastolic|pressure)\b/,
  },
  {
    id: "bone-muscle",
    match: /\b(bone|bones|density|muscle|muscles|musculoskeletal)\b/,
  },
  {
    id: "exercise",
    match: /\b(exercise|fitness|workout|activity|training|strength)\b/,
  },
  {
    id: "nutrition",
    match: /\b(hydration|water|fluid|nutrition|food|diet|meal)\b/,
  },
  {
    id: "behavioral",
    match: /\b(mood|stress|stressed|behavior|behaviour|mental|psychological)\b/,
  },
  {
    id: "standard-measures",
    match:
      /\b(missing|completeness|temperature|oxygen|spo2|saturation|measurements)\b/,
  },
  {
    id: "radiation-monitoring",
    match: /\b(cans|neutron|dosimeter|detector)\b|radiation.*monitor/,
  },
  { id: "radiation", match: /\bradiation\b/ },
  { id: "immune", match: /\b(immune|immunity|infection|virus|viruses)\b/ },
  { id: "sans", match: /\b(sans|eye|eyes|vision|ocular)\b/ },
  { id: "isolation", match: /\b(isolation|confinement|lonely)\b/ },
  { id: "distance", match: /\b(distance|communication|resupply)\b/ },
  {
    id: "closed-environment",
    match: /\b(habitat|hostile|closed environment|lighting|noise)\b/,
  },
] as const;

export function relevantTopicIds(question: string): string[] {
  const text = normalizeQuestion(question);
  // Record-keeping requests must not accidentally select radiation or habitat
  // just because the question contains "information" or "record".
  const matched: string[] = topics
    .filter((topic) => topic.match.test(text))
    .map((topic) => topic.id);
  if (matched.includes("radiation-monitoring") && matched.includes("radiation"))
    matched.splice(matched.indexOf("radiation"), 1);
  if (matched.length) return matched.slice(0, 2);
  if (/\b(microgravity|gravity|weightlessness)\b/.test(text))
    return ["gravity"];
  if (
    /\b(research|hazards|hrp|standard measures)\b/.test(text) &&
    /\b(nasa|csa|space|spaceflight|astronaut|health|hrp)\b/.test(text)
  )
    return ["space-research"];
  return [];
}

export function recordingQuestion(question: string) {
  return /what (?:information|details|context).*record|what should.*record/.test(
    normalizeQuestion(question),
  );
}

export function focusedEducation(question: string) {
  const text = normalizeQuestion(question);
  return relevantTopicIds(text).map((id) => {
    const entry = getKnowledgeEntry(id)!;
    let answer = entry.summary;
    if (id === "vestibular")
      answer = recordingQuestion(text)
        ? "If it is safe to make a note, record when the dizziness began, how long it lasted, what you were doing, and any accompanying symptoms. These are general recording prompts for a qualified reviewer, not an emergency checklist. Do not delay established crew medical procedures to complete a log."
        : "Dizziness can have different causes; a chat or wellness reading cannot identify yours. NASA studies how gravity changes affect orientation and the balance (vestibular) system. That research does not establish why an individual feels dizzy.";
    else if (id === "sleep" && /fatigue|tired|exhausted/.test(text))
      answer =
        "Fatigue can have several contributing factors. Sleep disruption, irregular schedules, and workload are useful context to discuss, but I cannot tell why you feel tired or diagnose a cause. Are you asking about the research, or would you like to review selected fictional demo sleep/fatigue entries with consent?";
    else if (id === "sleep")
      answer =
        "Sleep duration can change alongside schedules, light-dark cycles, and workload. NASA studies these influences on sleep and crew performance. Duration alone does not establish sleep quality or explain a personal change.";
    else if (id === "cardiovascular")
      answer = /blood pressure|systolic|diastolic|pressure/.test(text)
        ? "Blood pressure records have two components: systolic and diastolic pressure. Compare entries with their units and recording conditions in mind. NASA studies circulation changes during spaceflight; an app comparison cannot establish a diagnosis or a safe clinical range."
        : "In weightlessness, circulation and the work of the heart and blood vessels change. NASA studies these cardiovascular adaptations. A heart-rate pattern in this demo describes recorded values; it cannot determine a medical cause or fitness for duty.";
    else if (id === "bone-muscle")
      answer =
        "In microgravity, reduced loading changes the demands on bones and muscles. NASA studies spaceflight-related bone changes and countermeasures. Activity minutes in MissionPulse cannot measure bone density or muscle strength.";
    else if (id === "exercise")
      answer =
        "NASA studies exercise countermeasures for reduced musculoskeletal and cardiorespiratory fitness in spaceflight. Recorded exercise minutes show duration, not intensity, strength, or fitness. Use mission-prescribed activity plans rather than changing training from an app result.";
    else if (id === "nutrition")
      answer =
        "Hydration and food intake belong in the mission-approved nutrition plan. You can record water intake and relevant routine context, but this curated collection cannot assess hydration status, explain symptoms from intake, or prescribe a fluid target.";
    else if (id === "behavioral")
      answer =
        "Mood and stress entries describe how someone reports feeling; they are not a mental-health diagnosis. NASA studies behavioral responses to spaceflight stressors. Consistent notes about routine and well-being can support a discussion with the qualified crew support team.";
    else if (id === "standard-measures" && /missing|completeness/.test(text))
      answer =
        "Missing measurements are entries that were not recorded or cannot be used. They are not zero values. With consent, I can count available indicator-days in the selected fictional demo; missing values alone do not establish a health problem.";
    return {
      entry,
      answer,
      context: answer === entry.summary ? entry.whyItMatters : entry.summary,
    };
  });
}

// Only a bounded topic label/time range is carried across a local follow-up.
// Previous messages, symptoms, values, and consent are never copied to a request.
export function resolveFollowUp(
  question: string,
  messages: readonly ChatMessage[],
): string {
  const text = normalizeQuestion(question);
  if (
    relevantTopicIds(text).length ||
    !/^(and\b|why\b|what about\b|how about\b|tell me more\b|explain (?:it|that)\b|what (?:does|should)|has it\b|did it\b|is (?:it|that)\b|over\b)/.test(
      text,
    )
  )
    return question;
  const previous = messages.at(-1);
  if (
    !previous?.answer ||
    ["safety", "unsupported"].includes(previous.answer.category)
  )
    return question;
  const user = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  if (!user?.text) return question;
  const prior = normalizeQuestion(user.text);
  const ids = relevantTopicIds(prior).length
    ? relevantTopicIds(prior)
    : previous.answer.sources.map((source) => source.id).slice(0, 2);
  if (!ids.length) return question;
  const labels: Record<string, string> = {
    sleep:
      /fatigue|tired/.test(prior) && !/sleep/.test(prior) ? "fatigue" : "sleep",
    "bone-muscle": "bones and muscles",
    "standard-measures": /missing/.test(prior)
      ? "missing measurements"
      : "measurements",
  };
  const label = ids
    .map((id) => labels[id] ?? id.replaceAll("-", " "))
    .join(" and ");
  const personal =
    previous.answer.category === "records" ||
    previous.answer.category === "explanation";
  const range = /\b(7|seven|30|thirty|yesterday)\b/.test(text)
    ? ""
    : /yesterday/.test(prior)
      ? " yesterday"
      : /30|thirty/.test(prior)
        ? " over 30 days"
        : /7|seven/.test(prior)
          ? " over seven days"
          : "";
  return `${question} (about ${personal ? "my selected demo " : ""}${label}${range})`;
}

export function providerTopicQuestion(question: string) {
  // Never forward the raw user message: it may itself contain a name, symptom,
  // copied note, measurement, or other personal information.
  return `Explain approved space-health research for: ${relevantTopicIds(question).join(", ")}.`;
}
