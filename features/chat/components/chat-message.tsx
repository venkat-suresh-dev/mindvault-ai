"use client";

import { useState } from "react";
import { Bot, Check, Copy, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Citation } from "@/features/chat/types/chat";
import { CitationList } from "./citation-list";
import { MarkdownResponse } from "./markdown-response";

export function ChatMessage({ role, content, citations = [], isStreaming = false }: { role: "user" | "assistant"; content: string; citations?: Citation[]; isStreaming?: boolean }) {
  const [isCopied, setIsCopied] = useState(false);
  const copyResponse = async () => { try { await navigator.clipboard.writeText(content); setIsCopied(true); window.setTimeout(() => setIsCopied(false), 2_000); } catch { setIsCopied(false); } };
  const isUser = role === "user";
  return <article className={isUser ? "ml-auto flex max-w-[94%] items-start justify-end gap-2 sm:max-w-[85%]" : "flex max-w-[96%] items-start gap-2 sm:max-w-[90%]"}>
    {!isUser ? <div className="bg-primary/10 text-primary mt-1 rounded-lg p-1.5" aria-hidden="true"><Bot className="size-4" /></div> : null}
    <div className={isUser ? "bg-primary text-primary-foreground min-w-0 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-6 shadow-sm" : "border-border bg-background min-w-0 rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-7 shadow-sm"}>
      {isUser ? <p className="whitespace-pre-wrap">{content}</p> : <><MarkdownResponse content={content} isStreaming={isStreaming} /><div className="mt-3 flex items-center justify-between gap-3"><span className="text-muted-foreground text-xs">MindVault AI</span>{content ? <Button type="button" variant="ghost" size="icon-xs" onClick={() => void copyResponse()} aria-label="Copy response" title="Copy response">{isCopied ? <Check className="text-primary" /> : <Copy />}</Button> : null}</div><CitationList citations={citations} /></>}
    </div>
    {isUser ? <div className="bg-muted text-muted-foreground mt-1 rounded-lg p-1.5" aria-hidden="true"><UserRound className="size-4" /></div> : null}
  </article>;
}
