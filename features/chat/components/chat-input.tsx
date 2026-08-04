"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const chatInputSchema = z.object({ question: z.string().trim().min(1, "Enter a question.").max(2_000, "Keep questions under 2,000 characters.") });
type ChatInputValues = z.infer<typeof chatInputSchema>;

export function ChatInput({ disabled, onSubmit }: { disabled: boolean; onSubmit: (question: string) => Promise<void> }) {
  const form = useForm<ChatInputValues>({ resolver: zodResolver(chatInputSchema), defaultValues: { question: "" } });
  const submit = form.handleSubmit(async ({ question }) => {
    await onSubmit(question);
    form.reset();
  });
  return <form onSubmit={submit} className="border-border bg-background flex gap-2 rounded-xl border p-2"><label className="sr-only" htmlFor="book-question">Ask a question about this book</label><textarea id="book-question" {...form.register("question")} disabled={disabled} rows={2} className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" placeholder="Ask a question about this book..." /><Button type="submit" disabled={disabled} aria-label="Send question"><Send /></Button></form>;
}
