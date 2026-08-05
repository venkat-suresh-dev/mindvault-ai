"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, LoaderCircle, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatStreamEvent, Citation } from "@/features/chat/types/chat";
import type { ConversationMessagePage, ConversationMessageRecord, ConversationRecord } from "@/features/conversations/types/conversation";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface ChatMessageRecord { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; }

export function BookChat({ slug, bookTitle, conversation, disabled = false, conversationId, onConversationKnown, onConversationPersisted, onStreamingChange }: { slug: string; bookTitle: string; conversation?: ConversationRecord; disabled?: boolean; conversationId?: string; onConversationKnown: (conversation: ConversationRecord) => void; onConversationPersisted: () => void; onStreamingChange: (isStreaming: boolean) => void }) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [nextBeforeSequence, setNextBeforeSequence] = useState<number>();
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>();
  const skipLoadConversationId = useRef<string | undefined>(undefined);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      let isActive = true;
      queueMicrotask(() => { if (isActive) { setMessages([]); setNextBeforeSequence(undefined); setError(undefined); } });
      return () => { isActive = false; };
    }
    if (skipLoadConversationId.current === conversationId) { skipLoadConversationId.current = undefined; return; }
    const controller = new AbortController();
    setIsLoadingConversation(true); setError(undefined);
    fetchMessagePage(slug, conversationId, undefined, controller.signal).then((page) => { setMessages(page.messages.map(toChatMessage)); setNextBeforeSequence(page.nextBeforeSequence); }).catch((loadError: unknown) => { if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setError("Unable to load this conversation. Please try again."); }).finally(() => setIsLoadingConversation(false));
    return () => controller.abort();
  }, [conversationId, slug]);

  const loadEarlierMessages = async () => {
    if (!conversationId || !nextBeforeSequence) return;
    const container = messagesRef.current; const previousHeight = container?.scrollHeight ?? 0;
    setIsLoadingEarlier(true); setError(undefined);
    try { const page = await fetchMessagePage(slug, conversationId, nextBeforeSequence); setMessages((current) => [...page.messages.map(toChatMessage), ...current]); setNextBeforeSequence(page.nextBeforeSequence); requestAnimationFrame(() => { if (container) container.scrollTop += container.scrollHeight - previousHeight; }); }
    catch { setError("Unable to load earlier messages. Please try again."); }
    finally { setIsLoadingEarlier(false); }
  };

  const ask = async (question: string) => {
    setIsStreaming(true); onStreamingChange(true); setError(undefined);
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: question }, { id: assistantId, role: "assistant", content: "" }]);
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(slug)}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, ...(conversationId ? { conversationId } : {}) }) });
      if (!response.ok || !response.body) throw new Error("Unable to answer this question right now.");
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader(); let buffer = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += value; const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) { if (!line) continue; const event = parseChatEvent(line); if (!event) continue; if (event.type === "conversation" && event.conversation) { skipLoadConversationId.current = event.conversation.id; onConversationKnown(event.conversation); } applyEvent(event, assistantId, setMessages); if (event.type === "citations") onConversationPersisted(); if (event.type === "persistence-error") setError(event.text ?? "This response was not saved. You can continue chatting, but it may be missing when you return."); } }
    } catch (requestError) { const message = requestError instanceof Error ? requestError.message : "Unable to answer this question right now."; setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: message } : item)); }
    finally { setIsStreaming(false); onStreamingChange(false); }
  };

  return <section aria-labelledby="book-chat-heading" className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
    <header className="border-border bg-muted/30 border-b px-5 py-4"><div className="flex items-start gap-3"><div className="bg-primary/10 text-primary rounded-lg p-2"><MessageSquareText className="size-5" /></div><div className="min-w-0"><p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium"><BookOpen className="size-3.5" />{bookTitle}</p><h2 id="book-chat-heading" className="mt-1 truncate font-semibold">{conversation?.title ?? "New conversation"}</h2><p className="text-muted-foreground mt-1 text-xs">{conversation ? `${conversation.messageCount} ${conversation.messageCount === 1 ? "message" : "messages"}` : "Ask a question to begin"}</p></div></div></header>
    <div ref={messagesRef} className="min-h-72 max-h-[38rem] space-y-4 overflow-y-auto p-5" aria-live="polite">
      {nextBeforeSequence ? <div className="text-center"><Button type="button" variant="ghost" size="sm" disabled={isLoadingEarlier} onClick={() => void loadEarlierMessages()}>{isLoadingEarlier ? <LoaderCircle className="animate-spin" /> : null}{isLoadingEarlier ? "Loading earlier messages..." : "Load earlier messages"}</Button></div> : null}
      {isLoadingConversation ? <MessageSkeleton /> : messages.length > 0 ? messages.map((message, index) => <ChatMessage key={message.id} {...message} isStreaming={isStreaming && index === messages.length - 1 && message.role === "assistant"} />) : <EmptyChatState hasConversation={Boolean(conversationId)} />}
    </div>
    {error ? <p className="text-destructive mx-5 mb-3 text-sm" role="alert">{error}</p> : null}
    <div className="border-border border-t p-4"><ChatInput disabled={disabled || isStreaming || isLoadingConversation} onSubmit={ask} />{disabled ? <p className="text-muted-foreground mt-2 text-xs">Chat is available once processing and embeddings are complete.</p> : <p className="text-muted-foreground mt-2 text-xs">Answers are grounded only in this book’s retrieved passages.</p>}</div>
  </section>;
}

function EmptyChatState({ hasConversation }: { hasConversation: boolean }) { return <div className="text-muted-foreground flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><Sparkles className="text-primary size-6" /><h3 className="text-foreground mt-3 font-medium">{hasConversation ? "This conversation is ready" : "Select a conversation or start a new chat"}</h3><p className="mt-1 max-w-sm text-sm leading-5">{hasConversation ? "Ask a question to continue exploring this book." : "Choose a saved conversation from the menu, or use the message box below to begin."}</p></div>; }
function MessageSkeleton() { return <div className="space-y-4" aria-label="Loading conversation"><div className="bg-muted h-16 w-3/4 animate-pulse rounded-2xl" /><div className="bg-muted ml-auto h-12 w-1/2 animate-pulse rounded-2xl" /><div className="bg-muted h-28 w-5/6 animate-pulse rounded-2xl" /><p className="text-muted-foreground text-center text-sm">Loading conversation...</p></div>; }
async function fetchMessagePage(slug: string, conversationId: string, beforeSequence?: number, signal?: AbortSignal): Promise<ConversationMessagePage> { const search = new URLSearchParams({ limit: "30" }); if (beforeSequence) search.set("beforeSequence", String(beforeSequence)); const response = await fetch(`/api/books/${encodeURIComponent(slug)}/conversations/${conversationId}/messages?${search}`, { signal }); if (!response.ok) throw new Error("Unable to load messages."); return response.json() as Promise<ConversationMessagePage>; }
function toChatMessage(message: ConversationMessageRecord): ChatMessageRecord { return { id: message.id, role: message.role, content: message.content, citations: message.citations }; }
function applyEvent(event: ChatStreamEvent, assistantId: string, setMessages: React.Dispatch<React.SetStateAction<ChatMessageRecord[]>>) { setMessages((current) => current.map((item) => item.id !== assistantId ? item : event.type === "text" ? { ...item, content: `${item.content}${event.text ?? ""}` } : event.type === "citations" ? { ...item, citations: event.citations ?? [] } : event.type === "error" ? { ...item, content: event.text ?? "Unable to answer this question right now." } : item)); }
function parseChatEvent(line: string): ChatStreamEvent | undefined { try { const event: unknown = JSON.parse(line); if (!event || typeof event !== "object" || !("type" in event) || typeof event.type !== "string") return undefined; return event as ChatStreamEvent; } catch { return undefined; } }
