import { Markdown } from "@/components/markdown";
import type { Rubric, Scores } from "@/lib/practice";

type Criterion = Rubric["criteria"][number];

/** One radio group per criterion, a row for each level */
export function ScoreCriteria({
  idPrefix,
  criteria,
  requires,
  scores,
  onPick,
}: {
  idPrefix: string;
  criteria: readonly Criterion[];
  requires: readonly string[];
  scores: Scores;
  onPick: (criterionId: string, level: number) => void;
}) {
  return criteria.map((criterion) => {
    const name = `${idPrefix}-${criterion.id}`;
    const required = requires.includes(criterion.id);
    return (
      <fieldset key={criterion.id} className="flex flex-col gap-2">
        <legend className="mb-2 text-body font-semibold">
          {criterion.name}
          {required && (
            <span className="font-normal text-secondary">
              {" "}
              (needs level 3 to pass)
            </span>
          )}
        </legend>
        {criterion.levels.map((level, at) => {
          const value = at + 1;
          const picked = scores[criterion.id] === value;
          return (
            <label
              key={value}
              className={`flex min-h-control cursor-pointer items-start gap-3 border px-3 py-3 has-focus-visible:shadow-(--focus-ring) ${
                picked ? "border-accent bg-sunken" : "border-border"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={picked}
                onChange={() => onPick(criterion.id, value)}
                className="mt-1 size-4 shrink-0 accent-(--color-accent-default)"
              />
              <span className="flex flex-col gap-1">
                <span className="text-small font-semibold">Level {value}</span>
                <Markdown text={level} inline />
              </span>
            </label>
          );
        })}
      </fieldset>
    );
  });
}
