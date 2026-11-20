import { isSafeUrl, parseMarkdown } from "@meritory/content/markdown";
import type { ReactNode } from "react";
import { linkClass } from "./button";

/** The parts of an mdast node this renderer reads */
interface Node {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  depth?: number;
  ordered?: boolean | null;
  start?: number | null;
  children?: Node[];
}

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

/** The words of a node and everything under it */
function plainText(node: Node): string {
  if (node.type === "html") return "";
  if (node.value !== undefined) return node.value;
  if (node.type === "image") return node.alt ?? "";
  return (node.children ?? []).map(plainText).join("");
}

/** Heading ids from their words, numbered when two headings match */
function slugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base =
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

/** Every heading below the title, with the ids the rendered page uses */
export function markdownHeadings(text: string): Heading[] {
  const slug = slugger();
  const headings: Heading[] = [];
  for (const node of parseMarkdown(text).children as Node[]) {
    if (node.type !== "heading" || (node.depth ?? 1) < 2) continue;
    const words = plainText(node);
    headings.push({ depth: node.depth ?? 2, text: words, id: slug(words) });
  }
  return headings;
}

const HEADING_CLASS: Record<number, string> = {
  2: "mt-8 text-h2",
  3: "mt-6 text-h3",
  4: "mt-4 text-body font-semibold",
  5: "mt-4 text-body font-semibold",
  6: "mt-4 text-body font-semibold",
};

type Tag = "h2" | "h3" | "h4" | "h5" | "h6";

interface Context {
  slug: (text: string) => string;
}

function renderChildren(node: Node, context: Context): ReactNode[] {
  return (node.children ?? []).map((child, index) =>
    render(child, context, `${child.type}-${index}`),
  );
}

function renderTable(node: Node, context: Context, key: string) {
  const [head, ...body] = node.children ?? [];
  const columns = (head?.children ?? []).map(plainText);
  return (
    // Wide tables scroll inside here, so the page never scrolls sideways
    <section
      key={key}
      className="focus-ring my-4 overflow-x-auto"
      aria-label={`Table: ${columns.join(", ")}`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a keyboard user scrolls the table from here
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left text-small">
        <thead>
          <tr className="border-b border-border">
            {(head?.children ?? []).map((cell, index) => (
              <th
                key={index}
                scope="col"
                className="py-3 pr-4 align-bottom font-semibold"
              >
                {renderChildren(cell, context)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border">
              {(row.children ?? []).map((cell, index) => (
                <td key={index} className="py-3 pr-4 align-top">
                  {renderChildren(cell, context)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function render(node: Node, context: Context, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "paragraph":
      return (
        <p key={key} className="my-4">
          {renderChildren(node, context)}
        </p>
      );
    case "heading": {
      // The page shows the title itself
      if ((node.depth ?? 1) < 2) return null;
      const depth = Math.min(node.depth ?? 2, 6);
      const Tag = `h${depth}` as Tag;
      return (
        <Tag
          key={key}
          id={context.slug(plainText(node))}
          className={`scroll-mt-6 ${HEADING_CLASS[depth]}`}
        >
          {renderChildren(node, context)}
        </Tag>
      );
    }
    case "emphasis":
      return <em key={key}>{renderChildren(node, context)}</em>;
    case "strong":
      return (
        <strong key={key} className="font-semibold">
          {renderChildren(node, context)}
        </strong>
      );
    case "delete":
      return <del key={key}>{renderChildren(node, context)}</del>;
    case "inlineCode":
      return (
        <code key={key} className="font-mono text-code">
          {node.value}
        </code>
      );
    case "code":
      return (
        <pre
          key={key}
          className="my-4 overflow-x-auto bg-sunken p-4 font-mono text-code"
        >
          <code>{node.value}</code>
        </pre>
      );
    case "list": {
      const items = renderChildren(node, context);
      return node.ordered ? (
        <ol
          key={key}
          start={node.start ?? undefined}
          className="my-4 list-decimal pl-6"
        >
          {items}
        </ol>
      ) : (
        <ul key={key} className="my-4 list-disc pl-6">
          {items}
        </ul>
      );
    }
    case "listItem":
      return (
        <li key={key} className="my-2 pl-1 [&>p]:my-0">
          {renderChildren(node, context)}
        </li>
      );
    case "blockquote":
      return (
        <blockquote key={key} className="my-4 border-l-2 border-border pl-4">
          {renderChildren(node, context)}
        </blockquote>
      );
    case "thematicBreak":
      return <hr key={key} className="my-6 border-border-subtle" />;
    case "break":
      return <br key={key} />;
    case "link":
      // The content check refuses other links, so this only guards a bad bundle
      if (node.url === undefined || !isSafeUrl(node.url)) {
        return <span key={key}>{renderChildren(node, context)}</span>;
      }
      return (
        <a key={key} href={node.url} className={linkClass}>
          {renderChildren(node, context)}
        </a>
      );
    case "image":
      // Images from other sites are blocked by the page's policy, so show the words
      return node.alt ? <span key={key}>{node.alt}</span> : null;
    case "table":
      return renderTable(node, context, key);
    case "html":
      // Raw HTML never renders, not even as text
      return null;
    default:
      return node.children ? (
        <span key={key}>{renderChildren(node, context)}</span>
      ) : (
        (node.value ?? null)
      );
  }
}

interface MarkdownProps {
  text: string;
  /** One paragraph shown without its own paragraph, such as a card prompt */
  inline?: boolean;
  className?: string;
}

/** CommonMark and GFM tables as React elements, without raw HTML or unsafe links */
export function Markdown({ text, inline = false, className }: MarkdownProps) {
  const root = parseMarkdown(text) as Node;
  const context = { slug: slugger() };
  const [only] = root.children ?? [];
  if (inline && root.children?.length === 1 && only?.type === "paragraph") {
    return <span className={className}>{renderChildren(only, context)}</span>;
  }
  // Paragraph margins only space blocks apart, never pad the edges
  const edges = "[&>:first-child]:mt-0 [&>:last-child]:mb-0";
  return (
    <div className={className ? `${edges} ${className}` : edges}>
      {renderChildren(root, context)}
    </div>
  );
}
