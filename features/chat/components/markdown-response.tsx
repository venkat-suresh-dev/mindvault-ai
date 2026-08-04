import type { ReactNode } from "react";

export function MarkdownResponse({ content }: { content: string }) {
  if (!content) return <p className="text-muted-foreground">Thinking…</p>;
  return <div className="space-y-3">{parseBlocks(content)}</div>;
}

function parseBlocks(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={blocks.length} className="border-border bg-muted overflow-x-auto rounded-lg border p-3 text-xs leading-5"><code data-language={language || undefined}>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const className = level === 1 ? "text-lg font-semibold" : level === 2 ? "text-base font-semibold" : "text-sm font-semibold";
      blocks.push(<p key={blocks.length} className={className}>{renderInline(heading[2], blocks.length)}</p>);
      index += 1;
      continue;
    }

    const isOrderedList = /^\d+\.\s+/.test(line);
    const isUnorderedList = /^[-*+]\s+/.test(line);
    if (isOrderedList || isUnorderedList) {
      const items: string[] = [];
      const listPattern = isOrderedList ? /^\d+\.\s+/ : /^[-*+]\s+/;
      while (index < lines.length && listPattern.test(lines[index])) items.push(lines[index++].replace(listPattern, ""));
      const List = isOrderedList ? "ol" : "ul";
      blocks.push(<List key={blocks.length} className={isOrderedList ? "ml-5 list-decimal space-y-1" : "ml-5 list-disc space-y-1"}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `${blocks.length}-${itemIndex}`)}</li>)}</List>);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith("```") && !/^(#{1,3})\s+/.test(lines[index]) && !/^(?:[-*+]\s+|\d+\.\s+)/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={blocks.length}>{renderInline(paragraph.join(" "), blocks.length)}</p>);
  }

  return blocks;
}

function renderInline(text: string, keyPrefix: string | number): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={key} className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    return <span key={key}>{part}</span>;
  });
}
