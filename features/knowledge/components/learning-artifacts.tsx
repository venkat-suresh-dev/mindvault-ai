"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeArtifactRecord, MindMapNode } from "@/features/knowledge/types/knowledge";

export function LearningArtifactContent({ artifact }: { artifact: KnowledgeArtifactRecord }) {
  if (artifact.summary) return <SummaryReader artifact={artifact} />;
  if (artifact.takeaways) return <TakeawayReader artifact={artifact} />;
  if (artifact.flashcards) return <FlashcardStudy artifact={artifact} />;
  if (artifact.quiz) return <QuizStudy artifact={artifact} />;
  return artifact.mindMap ? <MindMap artifact={artifact} /> : null;
}

export function CitationPages({ citations }: { citations: KnowledgeArtifactRecord["sourceSegments"] }) {
  const pages = [...new Set(citations.map((citation) => citation.pageNumber))];
  return <p className="text-muted-foreground mt-3 text-xs">Sources · pages {pages.join(", ")}</p>;
}

function SummaryReader({ artifact }: { artifact: KnowledgeArtifactRecord }) {
  const summary = artifact.summary!;
  return <div className="mt-6 space-y-5"><div className="border-primary/20 bg-primary/5 rounded-2xl border p-5"><p className="text-primary text-xs font-semibold tracking-wide uppercase">Executive summary</p><p className="mt-3 text-sm leading-7">{summary.executiveSummary}</p></div><details className="border-border group rounded-xl border p-4" open><summary className="cursor-pointer font-semibold marker:text-primary">Book overview</summary><p className="text-muted-foreground mt-3 text-sm leading-7">{summary.overview}</p></details><div className="grid gap-4 md:grid-cols-2"><InsightList title="Main themes" items={summary.mainThemes} /><InsightList title="Important concepts" items={summary.importantConcepts} /></div><details className="border-border rounded-xl border p-4"><summary className="cursor-pointer font-semibold marker:text-primary">Arguments and conclusion</summary><ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-6">{summary.mainArguments.map((argument) => <li key={argument} className="flex gap-2"><span className="text-primary">•</span>{argument}</li>)}</ul><p className="mt-4 border-t pt-4 text-sm leading-7">{summary.conclusion}</p></details><CitationPages citations={artifact.sourceSegments} /></div>;
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return <section className="border-border rounded-xl border p-4"><h4 className="font-semibold">{title}</h4><ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-6">{items.map((item) => <li key={item} className="flex gap-2"><span className="text-primary">•</span>{item}</li>)}</ul></section>;
}

function TakeawayReader({ artifact }: { artifact: KnowledgeArtifactRecord }) {
  return <ol className="mt-6 grid gap-3 md:grid-cols-2">{artifact.takeaways!.items.map((item, index) => <li key={`${index}-${item.text}`} className="border-border bg-card rounded-xl border p-4"><span className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-lg text-xs font-bold">{String(index + 1).padStart(2, "0")}</span><p className="mt-4 text-sm leading-7">{item.text}</p><CitationPages citations={item.citations} /></li>)}</ol>;
}

function FlashcardStudy({ artifact }: { artifact: KnowledgeArtifactRecord }) {
  const cards = artifact.flashcards!.items;
  const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  const move = (next: number) => { setIndex(next); setRevealed(false); };
  return <div className="mt-6"><div className="mb-4 flex items-center justify-between text-sm"><span className="font-medium">Card {index + 1} of {cards.length}</span><span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-semibold">{card.difficulty.toLowerCase()}</span></div><div className="bg-muted h-1.5 overflow-hidden rounded-full"><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></div><button type="button" aria-pressed={revealed} aria-label={revealed ? "Show question" : "Reveal answer"} onClick={() => setRevealed((value) => !value)} className="border-border bg-card hover:border-primary/50 focus-visible:ring-primary/30 mt-5 min-h-64 w-full rounded-2xl border p-6 text-left shadow-sm transition-all focus-visible:ring-4"><div key={`${index}-${revealed ? "answer" : "question"}`} className="knowledge-card-flip"><p className="text-primary text-xs font-semibold tracking-wide uppercase">{revealed ? "Answer" : "Question"}</p><p className="mt-5 text-lg leading-8 font-medium">{revealed ? card.answer : card.question}</p><p className="text-muted-foreground mt-8 text-sm">{revealed ? "Tap to review the question" : "Tap or press Enter to reveal the answer"}</p>{revealed ? <CitationPages citations={card.citations} /> : null}</div></button><div className="mt-4 flex items-center justify-between gap-3"><Button type="button" variant="outline" disabled={index === 0} onClick={() => move(index - 1)}><ChevronLeft />Previous</Button><Button type="button" variant="outline" onClick={() => setRevealed((value) => !value)}>{revealed ? "Show question" : "Reveal answer"}</Button><Button type="button" variant="outline" disabled={index === cards.length - 1} onClick={() => move(index + 1)}>Next<ChevronRight /></Button></div></div>;
}

function QuizStudy({ artifact }: { artifact: KnowledgeArtifactRecord }) {
  const questions = artifact.quiz!.items;
  const [index, setIndex] = useState(0); const [choice, setChoice] = useState<string>(); const [submitted, setSubmitted] = useState(false); const [score, setScore] = useState(0);
  const question = questions[index]; const choices = question.type === "TRUE_FALSE" ? ["True", "False"] : question.options;
  const submit = () => { if (!choice || submitted) return; setSubmitted(true); if (choice === question.answer) setScore((value) => value + 1); };
  const next = () => { if (index < questions.length - 1) { setIndex((value) => value + 1); setChoice(undefined); setSubmitted(false); } };
  const restart = () => { setIndex(0); setChoice(undefined); setSubmitted(false); setScore(0); };
  return <div className="mt-6"><div className="mb-4 flex items-center justify-between text-sm"><span className="font-medium">Question {index + 1} of {questions.length}</span><span className="text-muted-foreground">Score {score}</span></div><div className="bg-muted h-1.5 overflow-hidden rounded-full"><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><div className="border-border bg-card mt-5 rounded-2xl border p-5"><span className="text-primary text-xs font-semibold tracking-wide uppercase">{question.type.replaceAll("_", " ")}</span><h4 className="mt-3 text-lg font-semibold leading-8">{question.question}</h4>{choices.length ? <div className="mt-5 grid gap-2">{choices.map((option) => <button key={option} type="button" disabled={submitted} onClick={() => setChoice(option)} className={`border-border rounded-xl border p-3 text-left text-sm transition-colors focus-visible:ring-4 focus-visible:ring-ring/30 ${choice === option ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>{option}</button>)}</div> : <p className="text-muted-foreground mt-5 text-sm">Consider your answer, then reveal the explanation.</p>}{!submitted ? <Button type="button" className="mt-5" disabled={choices.length > 0 && !choice} onClick={submit}>Submit answer</Button> : <div className={`mt-5 rounded-xl p-4 text-sm ${choice === question.answer ? "bg-primary/10" : "bg-destructive/10"}`}><p className="font-semibold">{choice === question.answer ? "Correct" : `Answer: ${question.answer}`}</p><p className="text-muted-foreground mt-2 leading-6">{question.explanation}</p><CitationPages citations={question.citations} /></div>}<div className="mt-5 flex justify-between gap-3">{index === questions.length - 1 ? <Button type="button" variant="outline" onClick={restart}><RotateCcw />Restart quiz</Button> : <Button type="button" variant="outline" disabled={!submitted} onClick={next}>Next question<ChevronRight /></Button>}</div></div></div>;
}

function MindMap({ artifact }: { artifact: KnowledgeArtifactRecord }) { return <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4"><p className="text-muted-foreground mb-4 text-sm">Select a branch to expand or collapse it.</p><MindMapNodeView node={artifact.mindMap!.root} depth={0} /><CitationPages citations={artifact.sourceSegments} /></div>; }

function MindMapNodeView({ node, depth }: { node: MindMapNode; depth: number }) { const [open, setOpen] = useState(depth < 1); const expandable = node.children.length > 0; return <div className={depth ? "ml-4 border-border border-l pl-4" : ""}><button type="button" disabled={!expandable} aria-expanded={expandable ? open : undefined} onClick={() => setOpen((value) => !value)} className="bg-card hover:bg-accent focus-visible:ring-ring/30 my-2 flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:ring-4 disabled:cursor-default"><Lightbulb className="text-primary size-4" />{node.topic}{expandable ? <span className="text-muted-foreground ml-auto text-xs">{open ? "Hide" : "Show"}</span> : null}</button>{open ? node.children.map((child, index) => <MindMapNodeView key={`${child.topic}-${index}`} node={child} depth={depth + 1} />) : null}</div>; }
