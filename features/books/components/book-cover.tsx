"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";

interface BookCoverProps {
  src?: string;
  title: string;
}

export function BookCover({ src, title }: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="from-primary/20 via-muted to-background flex size-full flex-col items-center justify-center bg-gradient-to-br p-6 text-center"><BookOpen className="text-primary size-10" /><span className="mt-3 font-semibold">{title}</span></div>;
  }

  return (
    // The protected route requires browser authentication; Next Image optimization cannot forward Clerk cookies.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Cover of ${title}`} className="size-full object-cover" onError={() => setFailed(true)} />
  );
}
