"use client";

import { useCallback, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookChat } from "@/features/chat/components/book-chat";
import { ConversationSidebar } from "@/features/conversations/components/conversation-sidebar";
import type { ConversationRecord } from "@/features/conversations/types/conversation";

export function ConversationWorkspace({ slug, bookTitle, disabled, initialConversations }: { slug: string; bookTitle: string; disabled: boolean; initialConversations: ConversationRecord[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [conversationError, setConversationError] = useState<string>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  const refreshConversations = useCallback(async () => {
    setIsRefreshing(true); setConversationError(undefined);
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(slug)}/conversations?limit=30`);
      if (!response.ok) throw new Error("Unable to load conversations.");
      const payload: { conversations: ConversationRecord[] } = await response.json();
      setConversations(payload.conversations);
    } catch { setConversationError("Unable to refresh conversations. Please try again."); }
    finally { setIsRefreshing(false); }
  }, [slug]);

  const renameConversation = async (conversationId: string, title: string) => {
    const previous = conversations;
    setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, title } : conversation));
    const response = await fetch(`/api/books/${encodeURIComponent(slug)}/conversations/${conversationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    if (!response.ok) { setConversations(previous); throw new Error("Unable to rename this conversation."); }
    const payload: { conversation: ConversationRecord } = await response.json();
    setConversations((current) => current.map((conversation) => conversation.id === conversationId ? payload.conversation : conversation));
  };

  const deleteConversation = async (conversationId: string) => {
    const response = await fetch(`/api/books/${encodeURIComponent(slug)}/conversations/${conversationId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Unable to delete this conversation.");
    const remainingConversations = conversations.filter((conversation) => conversation.id !== conversationId);
    setConversations(remainingConversations);
    if (selectedConversationId === conversationId) setSelectedConversationId(remainingConversations[0]?.id);
  };

  const startNewConversation = () => { setSelectedConversationId(undefined); setIsMobileSidebarOpen(false); };
  const selectConversation = (conversationId: string) => { setSelectedConversationId(conversationId); setIsMobileSidebarOpen(false); };
  const handleConversationKnown = (conversation: ConversationRecord) => { setSelectedConversationId(conversation.id); setConversations((current) => current.some((item) => item.id === conversation.id) ? current : [conversation, ...current]); };
  const sidebarProps = { conversations, selectedConversationId, isRefreshing, isBusy: isChatStreaming, error: conversationError, onNewConversation: startNewConversation, onSelectConversation: selectConversation, onRenameConversation: renameConversation, onDeleteConversation: deleteConversation };

  return <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-6">
    <div className="hidden xl:block"><ConversationSidebar {...sidebarProps} /></div>
    <div className="min-w-0 space-y-3">
      <div className="xl:hidden"><Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}><SheetTrigger asChild><Button type="button" variant="outline" className="w-full justify-between"><span className="flex items-center gap-2"><MessageSquareText />Conversations</span><span className="text-muted-foreground text-xs">{selectedConversation?.title ?? "New chat"}</span></Button></SheetTrigger><SheetContent side="left" className="w-[min(22rem,88vw)] overflow-y-auto p-4"><SheetHeader className="sr-only"><SheetTitle>Conversations</SheetTitle></SheetHeader><ConversationSidebar {...sidebarProps} /></SheetContent></Sheet></div>
      <BookChat slug={slug} bookTitle={bookTitle} conversation={selectedConversation} disabled={disabled} conversationId={selectedConversationId} onConversationKnown={handleConversationKnown} onConversationPersisted={() => void refreshConversations()} onStreamingChange={setIsChatStreaming} />
    </div>
  </div>;
}
