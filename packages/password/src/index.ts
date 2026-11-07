import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";

export const MIN_PASSWORD_LENGTH = 16;
export const MAX_PASSWORD_LENGTH = 128;

export type Strength = "weak" | "fair" | "good" | "strong";

export type PasswordProblem = "too_short" | "too_long" | "personal" | "weak";

export interface PasswordCheck {
  strength: Strength;
  /** Null when the password can be saved */
  problem: PasswordProblem | null;
  message: string;
}

export interface PersonalDetails {
  name?: string;
  email?: string;
}

const STRENGTH_BY_SCORE: Record<number, Strength> = {
  0: "weak",
  1: "weak",
  2: "fair",
  3: "good",
  4: "strong",
};

export const STRENGTH_MESSAGES: Record<Strength, string> = {
  weak: "Weak: easy to guess. Try a few unrelated words.",
  fair: "Fair: add another word to make it harder to guess.",
  good: "Good",
  strong: "Strong",
};

let estimator: ZxcvbnFactory | undefined;

function estimate(password: string, words: string[]): Strength {
  estimator ??= new ZxcvbnFactory({
    dictionary: { ...common.dictionary, ...english.dictionary },
    graphs: common.adjacencyGraphs,
    translations: english.translations,
  });
  return STRENGTH_BY_SCORE[estimator.check(password, words).score] ?? "weak";
}

/** Counts code points the way NIST does, so an emoji is one character */
export function countCharacters(password: string): number {
  return [...password].length;
}

function personalWords({ name, email }: PersonalDetails): string[] {
  const words = ["meritory"];
  const local = email?.split("@")[0];
  for (const word of [email, local, name, ...(name?.split(/\s+/) ?? [])]) {
    const clean = word?.trim().toLowerCase();
    if (clean && clean.length >= 3) words.push(clean);
  }
  return words;
}

export function checkPassword(
  password: string,
  details: PersonalDetails = {},
): PasswordCheck {
  const length = countCharacters(password);
  if (length > MAX_PASSWORD_LENGTH) {
    return {
      strength: "strong",
      problem: "too_long",
      message: `Use ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    };
  }

  const words = personalWords(details);
  const lower = password.toLowerCase();
  const personal = words.some((word) => lower.includes(word));
  const strength = personal ? "weak" : estimate(password, words);
  if (length < MIN_PASSWORD_LENGTH) {
    // A short password can't be saved, so the meter never calls it good
    return {
      strength: strength === "weak" ? "weak" : "fair",
      problem: "too_short",
      message: `Use at least ${MIN_PASSWORD_LENGTH} characters. You have ${length}.`,
    };
  }

  if (personal) {
    return {
      strength: "weak",
      problem: "personal",
      message: "Leave your name, email, and Meritory out of your password.",
    };
  }

  return {
    strength,
    problem: strength === "weak" ? "weak" : null,
    message: STRENGTH_MESSAGES[strength],
  };
}
