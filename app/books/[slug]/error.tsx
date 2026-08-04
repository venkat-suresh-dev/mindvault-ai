"use client";

import { Button } from "@/components/ui/button";

export default function BookDetailsError({ reset }: { reset: () => void }) {
  return <main className="container mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">We couldn’t load this book</h1><p className="text-muted-foreground mt-2">Please try again. If the issue persists, the book may be unavailable.</p><Button className="mt-5" onClick={reset}>Try again</Button></main>;
}
