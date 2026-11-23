export interface Term {
  term: string;
  definition: string;
}

export interface TermPart {
  text: string;
  /** Set when these words are a defined term */
  term?: Term;
}

const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Words cut where a defined term appears, longest term first, whatever its case */
export function splitTerms(words: string, terms: readonly Term[]): TermPart[] {
  if (terms.length === 0) return [{ text: words }];
  const longestFirst = [...terms].sort((a, b) => b.term.length - a.term.length);
  const pattern = new RegExp(
    `(${longestFirst.map((t) => escapeRegex(t.term)).join("|")})`,
    "gi",
  );
  return words
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => {
      const term = longestFirst.find(
        (t) => t.term.toLowerCase() === part.toLowerCase(),
      );
      return term ? { text: part, term } : { text: part };
    });
}
