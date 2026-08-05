"use client";

import { useState } from "react";
import { BookFallbackCover } from "./book-fallback-cover";

interface BookCoverProps {
  src?: string;
  title: string;
  author?: string | null;
  imageClassName?: string;
}

export function BookCover({ src, title, author, imageClassName }: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <BookFallbackCover title={title} author={author} />;
  }

  return (
    // The protected route requires browser authentication; Next Image optimization cannot forward Clerk cookies.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Cover of ${title}`} className={`size-full object-cover ${imageClassName ?? ""}`} onError={() => setFailed(true)} />
  );
}
