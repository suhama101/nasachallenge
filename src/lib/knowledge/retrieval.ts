import { knowledgeEntries, type KnowledgeEntry } from "./content";
const stopwords = new Set(
  "a an the is are be been does do did how what why which my i me we our your about in on of to for and or has have over last days nasa space health say tell can with it this that information should feel please explain".split(
    " ",
  ),
);
const aliases: Record<string, string[]> = {
  microgravity: ["gravity", "weightlessness"],
  cardiac: ["heart", "cardiovascular"],
  sleeping: ["sleep"],
  slept: ["sleep"],
  tired: ["fatigue"],
  musculoskeletal: ["bone", "muscle"],
  immune: ["immunity"],
  dizzy: ["dizziness", "vestibular"],
  radiation: ["dose", "exposure"],
  neutron: ["radiation", "cans"],
  bones: ["bone"],
  muscles: ["muscle"],
};
export function queryTokens(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 1 && !stopwords.has(word))
        .flatMap((word) => [word, ...(aliases[word] ?? [])]),
    ),
  ];
}
export function searchKnowledge(
  query: string,
  topic = "all",
  limit = knowledgeEntries.length,
): { entry: KnowledgeEntry; score: number }[] {
  const tokens = queryTokens(query);
  const matches = knowledgeEntries
    .filter((entry) => topic === "all" || entry.topic === topic)
    .map((entry) => {
      const title = entry.title.toLowerCase(),
        keywords = entry.keywords.join(" ").toLowerCase(),
        body = `${entry.summary} ${entry.indicators.join(" ")}`.toLowerCase();
      const score = tokens.reduce(
        (sum, token) =>
          sum +
          (title.includes(token) ? 6 : 0) +
          (keywords.split(/\s+/).includes(token) ? 5 : 0) +
          (body.includes(token) ? 1 : 0),
        0,
      );
      return { entry, score };
    });
  return matches
    .filter((match) => !query.trim() || match.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, Math.max(0, Math.min(limit, knowledgeEntries.length)));
}
export const MAX_RETRIEVED_SOURCES = 3;
export function retrieveKnowledge(query: string) {
  return queryTokens(query).length
    ? searchKnowledge(query, "all", MAX_RETRIEVED_SOURCES)
    : [];
}
