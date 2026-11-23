import { parseMarkdown } from "@meritory/content/markdown";
import { textStyles } from "@meritory/design-tokens";
import * as Linking from "expo-linking";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  isInline,
  linkTarget,
  listMarker,
  type MarkdownNode,
  plainText,
} from "../lib/markdown-nodes";
import { useTheme } from "../lib/theme";
import { FONT } from "./app-text";

type Theme = ReturnType<typeof useTheme>;
type TextVariant = "body" | "prompt" | "small";

interface Context {
  theme: Theme;
  variant: TextVariant;
}

function baseText({ theme, variant }: Context) {
  const text = textStyles[variant];
  return {
    color: theme.textPrimary,
    fontFamily: FONT.regular,
    fontSize: text.size,
    lineHeight: text.lineHeight ?? undefined,
  };
}

function renderInline(
  node: MarkdownNode,
  context: Context,
  key: string,
): ReactNode {
  const children = () =>
    (node.children ?? []).map((child, index) =>
      renderInline(child, context, `${child.type}-${index}`),
    );
  switch (node.type) {
    case "text":
      return node.value;
    case "emphasis":
      return (
        <Text key={key} style={styles.emphasis}>
          {children()}
        </Text>
      );
    case "strong":
      return (
        <Text key={key} style={{ fontFamily: FONT.strong }}>
          {children()}
        </Text>
      );
    case "delete":
      return (
        <Text key={key} style={styles.deleted}>
          {children()}
        </Text>
      );
    case "inlineCode":
      return (
        <Text
          key={key}
          style={{ fontFamily: FONT.mono, fontSize: textStyles.code.size }}
        >
          {node.value}
        </Text>
      );
    case "break":
      return "\n";
    case "link": {
      const target = linkTarget(node.url);
      // The content check refuses other links, so this only guards a bad bundle
      if (!target) return <Text key={key}>{children()}</Text>;
      return (
        <Text
          key={key}
          role="link"
          style={{ color: context.theme.textAccent, fontFamily: FONT.strong }}
          onPress={() => void Linking.openURL(target)}
        >
          {children()}
        </Text>
      );
    }
    case "image":
      // Images from other sites never load, so show the words
      return node.alt ?? null;
    case "html":
      // Raw HTML never renders, not even as text
      return null;
    default:
      return node.children ? children() : (node.value ?? null);
  }
}

function renderTable(node: MarkdownNode, context: Context, key: string) {
  const [head, ...body] = node.children ?? [];
  const columns = (head?.children ?? []).map(plainText);
  const row = (cells: MarkdownNode[], header: boolean, rowKey: string) => (
    <View
      key={rowKey}
      style={[styles.row, { borderBottomColor: context.theme.borderSubtle }]}
    >
      {cells.map((cell, index) => (
        <Text
          key={index}
          style={[
            baseText({ ...context, variant: "small" }),
            styles.cell,
            header && { fontFamily: FONT.strong },
          ]}
        >
          {(cell.children ?? []).map((child, at) =>
            renderInline(child, context, `${child.type}-${at}`),
          )}
        </Text>
      ))}
    </View>
  );
  return (
    // Wide tables scroll inside here, so the card never scrolls sideways
    <ScrollView
      key={key}
      horizontal
      accessibilityLabel={`Table: ${columns.join(", ")}`}
    >
      <View>
        {row(head?.children ?? [], true, "head")}
        {body.map((line, index) => row(line.children ?? [], false, `${index}`))}
      </View>
    </ScrollView>
  );
}

function renderBlock(
  node: MarkdownNode,
  context: Context,
  key: string,
): ReactNode {
  const blocks = () => renderBlocks(node.children ?? [], context);
  switch (node.type) {
    case "paragraph":
      return (
        <Text key={key} style={baseText(context)}>
          {(node.children ?? []).map((child, index) =>
            renderInline(child, context, `${child.type}-${index}`),
          )}
        </Text>
      );
    case "heading": {
      const text =
        (node.depth ?? 2) <= 2 ? textStyles.heading2 : textStyles.heading3;
      return (
        <Text
          key={key}
          role="heading"
          style={{
            color: context.theme.textPrimary,
            fontFamily: FONT.strong,
            fontSize: text.size,
            lineHeight: text.lineHeight ?? undefined,
          }}
        >
          {(node.children ?? []).map((child, index) =>
            renderInline(child, context, `${child.type}-${index}`),
          )}
        </Text>
      );
    }
    case "code":
      return (
        // Long lines scroll sideways, because wrapped code is hard to read
        <ScrollView
          key={key}
          horizontal
          style={{ backgroundColor: context.theme.bgSunken }}
          contentContainerStyle={styles.code}
        >
          <Text
            style={{
              color: context.theme.textPrimary,
              fontFamily: FONT.mono,
              fontSize: textStyles.code.size,
              lineHeight: textStyles.code.lineHeight ?? undefined,
            }}
          >
            {node.value}
          </Text>
        </ScrollView>
      );
    case "list":
      return (
        <View key={key} style={styles.blocks}>
          {(node.children ?? []).map((item, index) => (
            <View key={index} style={styles.item}>
              <Text style={[baseText(context), styles.marker]}>
                {listMarker(node, index)}
              </Text>
              <View style={[styles.blocks, styles.fill]}>
                {renderBlocks(item.children ?? [], context)}
              </View>
            </View>
          ))}
        </View>
      );
    case "blockquote":
      return (
        <View
          key={key}
          style={[
            styles.blocks,
            styles.quote,
            { borderLeftColor: context.theme.borderDefault },
          ]}
        >
          {blocks()}
        </View>
      );
    case "thematicBreak":
      return (
        <View
          key={key}
          style={[styles.rule, { backgroundColor: context.theme.borderSubtle }]}
        />
      );
    case "table":
      return renderTable(node, context, key);
    case "html":
      return null;
    default:
      return node.children ? (
        <View key={key} style={styles.blocks}>
          {blocks()}
        </View>
      ) : null;
  }
}

/** Blocks in order, with loose inline nodes gathered into one line of text */
function renderBlocks(nodes: MarkdownNode[], context: Context): ReactNode[] {
  const out: ReactNode[] = [];
  let line: MarkdownNode[] = [];
  const flush = () => {
    if (line.length === 0) return;
    out.push(
      renderBlock(
        { type: "paragraph", children: line },
        context,
        `line-${out.length}`,
      ),
    );
    line = [];
  };
  for (const node of nodes) {
    if (isInline(node)) {
      line.push(node);
      continue;
    }
    flush();
    out.push(renderBlock(node, context, `${node.type}-${out.length}`));
  }
  flush();
  return out;
}

interface MarkdownProps {
  text: string;
  /** The size of plain paragraphs, such as prompt for a card's question */
  variant?: TextVariant;
}

/** CommonMark and GFM tables as native views, without raw HTML or unsafe links */
export function Markdown({ text, variant = "body" }: MarkdownProps) {
  const theme = useTheme();
  const root = parseMarkdown(text) as MarkdownNode;
  return (
    <View style={styles.blocks}>
      {renderBlocks(root.children ?? [], { theme, variant })}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: { gap: 16 },
  fill: { flex: 1 },
  emphasis: { fontStyle: "italic" },
  deleted: { textDecorationLine: "line-through" },
  code: { padding: 16 },
  item: { flexDirection: "row", gap: 8 },
  marker: { minWidth: 20 },
  quote: { borderLeftWidth: 2, paddingLeft: 16 },
  rule: { height: 1 },
  row: { flexDirection: "row", borderBottomWidth: 1 },
  cell: { width: 160, paddingVertical: 12, paddingRight: 16 },
});
