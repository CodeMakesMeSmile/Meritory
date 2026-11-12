import { appendFile } from "node:fs/promises";
import path from "node:path";
import { formatProblem, type LoadedFact, loadTrackFacts } from "./load.ts";
import {
  DUE_SOON_DAYS,
  type Due,
  type RecheckReport,
  recheckReport,
  todayUtc,
} from "./recheck.ts";

type Report = RecheckReport<LoadedFact>;
type Item = Due<LoadedFact>;

// GitHub's own escaping for workflow commands, so text can't end a command or start a new one
export function escapeData(text: string): string {
  return text
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

export function escapeProperty(text: string): string {
  return escapeData(text).replaceAll(":", "%3A").replaceAll(",", "%2C");
}

function relativeFile(file: string, root: string): string {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function where(item: Item, root: string): string {
  const file = relativeFile(item.fact.file, root);
  return item.fact.line === null ? file : `${file}:${item.fact.line}`;
}

const facts = (count: number) =>
  count === 1 ? "1 fact is" : `${count} facts are`;

/** The report as plain text for a terminal */
export function formatText(report: Report, root: string): string {
  if (report.overdue.length === 0 && report.dueSoon.length === 0) {
    return `No facts are due for a recheck in the next ${DUE_SOON_DAYS} days.`;
  }
  const lines: string[] = [];
  const section = (heading: string, items: Item[]) => {
    if (items.length === 0) return;
    if (lines.length > 0) lines.push("");
    lines.push(heading);
    for (const item of items) {
      lines.push(
        `  ${item.fact.id} (${item.fact.category}), due ${item.dueOn}`,
        `    checked on ${item.fact.checkedOn} in ${where(item, root)}`,
        ...item.fact.sources.map((source) => `    ${source.url}`),
      );
    }
  };
  section(
    `${facts(report.overdue.length)} past the recheck date and hidden from learners:`,
    report.overdue,
  );
  section(
    `${facts(report.dueSoon.length)} due within ${DUE_SOON_DAYS} days:`,
    report.dueSoon,
  );
  return lines.join("\n");
}

function annotation(
  level: "warning" | "notice",
  title: string,
  message: string,
  item: Item,
  root: string,
): string {
  const properties = [
    `file=${escapeProperty(relativeFile(item.fact.file, root))}`,
    item.fact.line === null ? null : `line=${item.fact.line}`,
    `title=${escapeProperty(title)}`,
  ].filter((property) => property !== null);
  return `::${level} ${properties.join(",")}::${escapeData(message)}`;
}

const sources = (item: Item) =>
  item.fact.sources.map((source) => source.url).join(", ");

/** Warnings for overdue facts and notices for facts due soon */
export function formatAnnotations(report: Report, root: string): string[] {
  return [
    ...report.overdue.map((item) =>
      annotation(
        "warning",
        "Fact past its recheck date",
        `${item.fact.id} was due on ${item.dueOn} and is hidden from learners. Checked on ${item.fact.checkedOn}. Sources: ${sources(item)}`,
        item,
        root,
      ),
    ),
    ...report.dueSoon.map((item) =>
      annotation(
        "notice",
        "Fact due for a recheck",
        `${item.fact.id} is due on ${item.dueOn}. Checked on ${item.fact.checkedOn}. Sources: ${sources(item)}`,
        item,
        root,
      ),
    ),
  ];
}

// Keeps text from breaking out of a table cell or turning into markup
function cell(text: string): string {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll(/[\r\n]+/g, " ");
}

function link(title: string, url: string): string {
  const text = cell(title).replaceAll("[", "\\[").replaceAll("]", "\\]");
  const href = url
    .replaceAll("(", "%28")
    .replaceAll(")", "%29")
    .replaceAll(" ", "%20");
  return `[${text}](${href})`;
}

/** The report as Markdown for a CI job summary */
export function formatSummary(
  report: Report,
  root: string,
  today: string,
): string {
  const lines = [
    "## Facts due for a recheck",
    "",
    `Report for ${today} (UTC), looking ${DUE_SOON_DAYS} days ahead.`,
    "",
  ];
  const rows = [
    ...report.overdue.map((item) => ["Overdue, hidden", item] as const),
    ...report.dueSoon.map((item) => ["Due soon", item] as const),
  ];
  if (rows.length === 0) {
    lines.push("Nothing is due.");
    return `${lines.join("\n")}\n`;
  }
  lines.push(
    "| Status | Due on | Fact | Category | Checked on | Where | Sources |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const [status, item] of rows) {
    const links = item.fact.sources
      .map((source) => link(source.title, source.url))
      .join("<br>");
    lines.push(
      `| ${status} | ${item.dueOn} | \`${cell(item.fact.id)}\` | ${cell(item.fact.category)} | ${item.fact.checkedOn} | ${cell(where(item, root))} | ${links} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

export type RecheckOptions = {
  trackDir: string;
  /** Paths in the output are relative to this */
  root: string;
  today?: string;
  /** Adds annotations, as GitHub Actions reads them */
  github?: boolean;
  /** Where GitHub Actions collects the job summary */
  summaryFile?: string;
  out?: (text: string) => void;
  err?: (text: string) => void;
};

/**
 * Prints the recheck report and returns the exit code. Overdue facts don't
 * fail the run, since learners already can't see them, but content with
 * problems does, so the report never runs on half-loaded files.
 */
export async function runRecheck({
  trackDir,
  root,
  today = todayUtc(),
  github = false,
  summaryFile,
  out = console.log,
  err = console.error,
}: RecheckOptions): Promise<number> {
  const { facts, problems } = await loadTrackFacts(trackDir, today);
  if (problems.length > 0) {
    for (const problem of problems) {
      err(formatProblem(problem, root));
      if (github) {
        const properties = [
          `file=${escapeProperty(relativeFile(problem.file, root))}`,
          problem.line === null ? null : `line=${problem.line}`,
        ].filter((property) => property !== null);
        out(`::error ${properties.join(",")}::${escapeData(problem.message)}`);
      }
    }
    return 1;
  }

  const report = recheckReport(facts, today);
  out(formatText(report, root));
  if (github) {
    for (const line of formatAnnotations(report, root)) out(line);
    if (summaryFile) {
      await appendFile(summaryFile, formatSummary(report, root, today));
    }
  }
  return 0;
}
