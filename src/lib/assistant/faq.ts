import { normalizeQuestion } from "./intent";

// FAQ-only corrections: leave health retrieval and measurement matching unchanged.
const spellings: Record<string, string> = {
  r: "are",
  u: "you",
  arewe: "are we",
  areyou: "are you",
  canwe: "can we",
  canyou: "can you",
  isthis: "is this",
  isit: "is it",
  withme: "with me",
  chating: "chatting",
  chattng: "chatting",
  chattingg: "chatting",
  livechat: "live chatting",
  conected: "connected",
  connnected: "connected",
  conect: "connect",
  acess: "access",
  acces: "access",
  helth: "health",
  recods: "records",
  questons: "questions",
  qustions: "questions",
  capabilites: "capabilities",
  capabilties: "capabilities",
  artifical: "artificial",
  inteligence: "intelligence",
};

export function assistantFaq(question: string, liveAvailable?: boolean) {
  const text = normalizeQuestion(question)
    .replace(/\ba\.i\./g, "ai")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b[a-z]+\b/g, (word) => spellings[word] ?? word)
    .replace(/\s+/g, " ")
    .trim();
  const availability =
    liveAvailable === true
      ? "Optional live Groq selection is currently available by choice."
      : liveAvailable === false
        ? "Optional live Groq selection is currently unavailable."
        : "The live-selection control on this page shows whether optional Groq selection is available.";
  const mode = `This reply is a local curated response, not live generative AI. ${availability} When available and explicitly enabled, Groq can only select approved research statements; it cannot freely generate medical advice.`;
  let id: string;
  let answer: string;
  let sources: string[] = [];
  if (
    /^(?:(?:are you|are we|is this) (?:doing |having )?(?:live )?chanting|can (?:you|we) (?:do )?chanting|(?:what about )?chanting)(?: (?:now|today|right now))?$/.test(
      text,
    )
  ) {
    id = "clarify";
    answer =
      "Did you mean chatting? I can answer supported space-health questions using curated responses. If you meant chanting, please clarify what you want to know. This reply is local, not live generative AI.";
  } else if (
    /^(?:(?:are we|are you|is this|is it) (?:doing |having )?(?:a )?(?:live |real time )?(?:chat|chatting|conversation)(?: live| in real time| with (?:me|you|us)){0,2}(?: (?:now|right now))?|(?:is (?:live ai|groq) (?:available|enabled)|are you (?:live|online)|can (?:we|you) (?:chat|talk)(?: with (?:me|you))?(?: live)?))$/.test(
      text,
    )
  ) {
    id = "live";
    answer =
      "You are chatting with MissionPulse's local research assistant, not unrestricted live generative AI. I provide curated NASA/CSA educational answers and can review selected demo measurements with your permission.";
  } else if (
    /^(?:are you (?:really )?(?:an? )?(?:real )?(?:ai|artificial intelligence|chatbot|bot|human)(?: assistant)?|who are you|what are you)$/.test(
      text,
    )
  ) {
    id = "identity";
    answer = `I am MissionPulse's educational assistant, not a human or an official NASA medical assistant. ${mode}`;
  } else if (
    /^(?:what (?:can you (?:do|help(?: me)? with)|do you do|are your capabilities|can i ask(?: you)?|(?:questions|topics) can you (?:answer|help with))|how can you help(?: me)?|how are you(?: doing)?|can you (?:help(?: me)?(?: out)?|answer (?:my )?questions)|hi|hello|hey)$/.test(
      text,
    )
  ) {
    id = "capabilities";
    answer = `I can explain curated space-health research, answer supported measurement questions, and review selected fictional demo entries only with explicit per-message consent. Try asking about fatigue, sleep, heart rate, or what to record when dizzy. I cannot diagnose, prescribe, or access personal cloud health records. ${mode}`;
  } else if (
    /^(?:(?:are you|is missionpulse) (?:connected|linked|affiliated) (?:to|with) nasa|are you (?:an? )?(?:official )?nasa (?:medical )?assistant|(?:where do your sources come from|what (?:research )?sources do you use|do you use nasa (?:research|sources)))$/.test(
      text,
    )
  ) {
    id = "sources";
    answer =
      "MissionPulse links to public NASA and Canadian Space Agency research for education. It is not connected to NASA systems, is not an official NASA medical assistant, and is not NASA-endorsed or clinically validated. Research references are not access to astronaut records or live NASA data.";
    sources = ["standard-measures", "space-research"];
  } else if (
    /^(?:(?:do you have access to|can you (?:access|read|see)|do you (?:access|read|see)) (?:my |our )?(?:(?:personal |medical |health |cloud )*(?:records|data|measurements|history))|(?:can you see my (?:check ins|checkins)))$/.test(
      text,
    )
  ) {
    id = "privacy";
    answer =
      "I do not have access to your personal cloud health records. I can review only the selected fictional demo measurements when you explicitly check 'Use selected demo measurements for this message'. Consent is required again for each message. I have not read any measurements for this FAQ reply. Raw measurements, identities, notes, symptoms, and previous conversations are not sent to Groq.";
  } else return undefined;
  return { id: `faq-${id}`, text: answer, sources };
}

// A small scope guard, not a medical classifier or emergency assessment.
// These subjects/interventions have no approved answers in this collection;
// do not turn a shared word like "sleep" into evidence for treating a condition.
export function unsupportedMedicalTopic(question: string) {
  const text = normalizeQuestion(question);
  return (
    /\b(cancer|diabetes|migraine\w*|arthritis|rash|toothache|pregnan\w*|melanoma|sleep apn(?:ea|oea)|cure\w*|remed(?:y|ies)|antibiotics?|surgery)\b/.test(
      text,
    ) ||
    (/\btreat(?:ment|ing)?\b/.test(text) &&
      !/\b(missing|records?|data|measurements?)\b/.test(text)) ||
    (/\bchanting\b/.test(text) &&
      /\b(health|sleep|stress|fatigue|symptoms?)\b/.test(text))
  );
}
