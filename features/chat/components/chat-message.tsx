import type { Citation } from "@/features/chat/types/chat";
import { CitationList } from "./citation-list";
import { MarkdownResponse } from "./markdown-response";

export function ChatMessage({ role, content, citations = [] }: { role: "user" | "assistant"; content: string; citations?: Citation[] }) {
  return <article className={role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground" : "border-border bg-background max-w-[90%] rounded-xl border px-4 py-3 text-sm leading-6"}>{role === "user" ? <p className="whitespace-pre-wrap">{content}</p> : <MarkdownResponse content={content} />}{role === "assistant" && <CitationList citations={citations} />}</article>;
}
