export function safetyConcern(
  question: string,
  urgentReported = false,
): "urgent" | "restricted" | null {
  const text = question.toLowerCase().normalize("NFKC");
  if (
    urgentReported ||
    /\b(emergency|urgent symptom|chest pain|can(?:not|'t|’t) breathe|severe (?:shortness of breath|breathing)|unconscious|passed out|suicid\w*|kill myself|self[- ]harm)\b/.test(
      text,
    )
  )
    return "urgent";
  if (
    /\b(ignore (?:all |the )?(?:previous|prior|system|safety)|system prompt|developer instructions|jailbreak|reveal (?:the |your )?(?:key|secret)|bypass|diagnos\w*|prescrib\w*|dosage|treatment plan|what (?:medicine|medication)|dose of (?!radiation))\b/.test(
      text,
    )
  )
    return "restricted";
  return null;
}
export const emergencyMessage =
  "Seek immediate assessment through your designated crew medical officer or the established mission emergency procedure. Do not wait for another reading or an AI answer. If communication is unavailable, use the established mission emergency procedure; this assistant cannot invent a substitute protocol or treatment.";
export const safetyLimit =
  "No mission-approved medical protocol is configured here. Statistical similarity and a normal-looking single measurement cannot rule out an emergency. This keyword guard is limited, is not clinical triage, and may miss urgent reports or conservatively flag general questions.";
