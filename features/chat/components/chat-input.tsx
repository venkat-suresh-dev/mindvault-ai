"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const chatInputSchema = z.object({ question: z.string().trim().min(1, "Enter a question.").max(2_000, "Keep questions under 2,000 characters.") });
type ChatInputValues = z.infer<typeof chatInputSchema>;

const SUGGESTIONS = ["Explain the core ideas in this book", "Summarize a key chapter", "Quiz me on the important concepts"];

export function ChatInput({ disabled, onSubmit, showSuggestions = true }: { disabled: boolean; onSubmit: (question: string) => Promise<void>; showSuggestions?: boolean }) {
  const form = useForm<ChatInputValues>({ resolver: zodResolver(chatInputSchema), defaultValues: { question: "" } });
  const submit = form.handleSubmit(async ({ question }) => {
    await onSubmit(question);
    form.reset();
  });
  const askSuggestion = (question: string) => {
    form.setValue("question", question, { shouldValidate: true });
    void onSubmit(question).then(() => form.reset());
  };
  return <div className="space-y-3">
    {showSuggestions ? <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"><span className="flex items-center gap-1 font-medium"><Sparkles className="text-primary size-3.5" />Try asking</span>{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" disabled={disabled} onClick={() => askSuggestion(suggestion)} className="border-border bg-background hover:border-primary/40 hover:text-foreground rounded-full border px-2.5 py-1 transition-colors disabled:cursor-not-allowed">{suggestion}</button>)}</div> : null}
    <form onSubmit={submit} className="border-border bg-background focus-within:border-primary/50 focus-within:ring-primary/10 flex gap-2 rounded-xl border p-2 transition-colors focus-within:ring-4"><label className="sr-only" htmlFor="book-question">Ask a question about this book</label><textarea id="book-question" {...form.register("question")} disabled={disabled} rows={2} className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" placeholder="Ask anything about this book…" /><Button type="submit" disabled={disabled} aria-label="Send question"><Send /></Button></form>
  </div>;
}
