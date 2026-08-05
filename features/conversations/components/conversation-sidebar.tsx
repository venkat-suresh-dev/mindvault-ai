"use client";

import { useState } from "react";
import { Check, LoaderCircle, MessageCircleQuestion, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConversationRecord } from "@/features/conversations/types/conversation";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: ConversationRecord[];
  selectedConversationId?: string;
  isRefreshing: boolean;
  isBusy: boolean;
  error?: string;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
}

export function ConversationSidebar({ conversations, selectedConversationId, isRefreshing, isBusy, error, onNewConversation, onSelectConversation, onRenameConversation, onDeleteConversation }: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string>();
  const [title, setTitle] = useState("");
  const [operationError, setOperationError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();

  const beginEditing = (conversation: ConversationRecord) => { setEditingId(conversation.id); setTitle(conversation.title); setOperationError(undefined); };
  const saveTitle = async () => {
    const normalizedTitle = title.trim();
    if (!editingId) return;
    if (!normalizedTitle || normalizedTitle.length > 120) { setOperationError("Enter a name between 1 and 120 characters."); return; }
    setIsSaving(true);
    try { await onRenameConversation(editingId, normalizedTitle); setEditingId(undefined); setOperationError(undefined); }
    catch (renameError) { setOperationError(renameError instanceof Error ? renameError.message : "Unable to rename this conversation."); }
    finally { setIsSaving(false); }
  };
  const removeConversation = async (conversationId: string) => {
    setDeletingId(conversationId);
    try { await onDeleteConversation(conversationId); }
    catch (deleteError) { setOperationError(deleteError instanceof Error ? deleteError.message : "Unable to delete this conversation."); }
    finally { setDeletingId(undefined); }
  };

  return <aside className="border-border bg-muted/35 h-fit rounded-2xl border p-3 shadow-sm" aria-labelledby="conversations-heading">
    <div className="flex items-center justify-between gap-3"><div><h2 id="conversations-heading" className="font-semibold">Conversations</h2><p className="text-muted-foreground mt-1 text-xs">Your chats about this book</p></div>{isRefreshing ? <LoaderCircle className="text-muted-foreground size-4 animate-spin" aria-label="Refreshing conversations" /> : null}</div>
    <Button type="button" className="mt-4 w-full shadow-sm" onClick={onNewConversation} disabled={isBusy}><MessageSquarePlus />New chat</Button>
    {operationError ?? error ? <p className="text-destructive mt-2 text-xs" role="alert">{operationError ?? error}</p> : null}
    <div className="mt-4 space-y-1" aria-live="polite">
      {conversations.length === 0 ? <EmptyConversationState /> : conversations.map((conversation) => {
        const isEditing = editingId === conversation.id;
        const isSelected = selectedConversationId === conversation.id;
        return <div key={conversation.id} className={cn("group rounded-xl border-l-2 border-transparent", isSelected && "border-primary bg-primary/10 shadow-sm")}>
          {isEditing ? <div className="space-y-2 p-2"><Input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveTitle(); if (event.key === "Escape") setEditingId(undefined); }} aria-label="Conversation name" autoFocus /><div className="flex justify-end gap-1"><Button type="button" variant="ghost" size="icon-xs" onClick={() => setEditingId(undefined)} aria-label="Cancel renaming"><X /></Button><Button type="button" size="icon-xs" onClick={() => void saveTitle()} disabled={isSaving} aria-label="Save conversation name"><Check /></Button></div></div> : <div className="flex items-center gap-1 p-1"><button type="button" onClick={() => onSelectConversation(conversation.id)} disabled={isBusy} aria-current={isSelected ? "page" : undefined} className="focus-visible:ring-ring hover:bg-muted/70 min-w-0 flex-1 rounded-md px-2.5 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"><p className="truncate text-sm font-medium">{conversation.title}</p><p className="text-muted-foreground mt-1 flex flex-wrap gap-x-2 text-xs"><span>{conversation.messageCount} {conversation.messageCount === 1 ? "message" : "messages"}</span><span aria-hidden="true">•</span><span>{formatUpdatedAt(conversation.lastMessageAt ?? conversation.updatedAt)}</span></p></button><div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><Button type="button" variant="ghost" size="icon-xs" onClick={() => beginEditing(conversation)} disabled={isBusy} aria-label={`Rename ${conversation.title}`}><Pencil /></Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon-xs" disabled={isBusy} aria-label={`Delete ${conversation.title}`}><Trash2 className="text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Delete conversation?</AlertDialogTitle><AlertDialogDescription>This permanently removes this conversation and its messages.</AlertDialogDescription><div className="flex justify-end gap-2"><AlertDialogCancel asChild><Button type="button" variant="outline">Cancel</Button></AlertDialogCancel><Button type="button" variant="destructive" disabled={deletingId === conversation.id} onClick={() => void removeConversation(conversation.id)}>Delete</Button></div></AlertDialogContent></AlertDialog></div></div>}
        </div>;
      })}
    </div>
  </aside>;
}

function EmptyConversationState() { return <div className="border-border bg-muted/40 rounded-xl border border-dashed px-4 py-5 text-sm"><MessageCircleQuestion className="text-primary size-5" /><h3 className="mt-3 font-medium">Start your first conversation</h3><p className="text-muted-foreground mt-1 leading-5">Ask questions about this book, explore key ideas, or unpack difficult sections.</p><ul className="text-muted-foreground mt-3 space-y-1.5 text-xs"><li>• Explain chapter concepts</li><li>• Summarize a section</li><li>• Clarify difficult topics</li></ul></div>; }

function formatUpdatedAt(value: string): string {
  const difference = Date.now() - new Date(value).getTime();
  if (difference < 60_000) return "Just now";
  if (difference < 3_600_000) return `${Math.floor(difference / 60_000)} minutes ago`;
  if (difference < 86_400_000) return `${Math.floor(difference / 3_600_000)} hours ago`;
  if (difference < 172_800_000) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
