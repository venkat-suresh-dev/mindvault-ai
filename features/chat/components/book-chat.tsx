"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { ChatStreamEvent, Citation } from "@/features/chat/types/chat";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface Message { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; }

export function BookChat({ slug, disabled = false }: { slug: string; disabled?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ask = async (question: string) => {
    setIsLoading(true);
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: question }, { id: assistantId, role: "assistant", content: "" }]);
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(slug)}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      if (!response.ok || !response.body) throw new Error("Unable to answer this question right now.");
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) applyEvent(JSON.parse(line) as ChatStreamEvent, assistantId, setMessages);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to answer this question right now.";
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: message } : item));
    } finally { setIsLoading(false); }
  };
  return <section aria-labelledby="book-chat-heading" className="border-border bg-card rounded-2xl border p-5 shadow-sm"><div className="flex items-start gap-3"><div className="bg-primary/10 text-primary rounded-lg p-2"><MessageSquareText className="size-5" /></div><div><h2 id="book-chat-heading" className="font-semibold">Chat With This Book</h2><p className="text-muted-foreground mt-1 text-sm">Answers are grounded only in this book’s retrieved passages.</p></div></div><div className="mt-5 space-y-3" aria-live="polite">{messages.map((message) => <ChatMessage key={message.id} {...message} />)}</div><div className="mt-5"><ChatInput disabled={disabled || isLoading} onSubmit={ask} />{disabled && <p className="text-muted-foreground mt-2 text-xs">Chat is available once processing and embeddings are complete.</p>}</div></section>;
}

function applyEvent(event: ChatStreamEvent, assistantId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  setMessages((current) => current.map((item) => item.id !== assistantId ? item : event.type === "text" ? { ...item, content: `${item.content}${event.text ?? ""}` } : event.type === "citations" ? { ...item, citations: event.citations ?? [] } : event.type === "error" ? { ...item, content: event.text ?? "Unable to answer this question right now." } : item));
}
