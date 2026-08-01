import { Brain } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="MindVault AI Home"
      className="focus-visible:ring-ring flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
        <Brain className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="text-foreground hidden font-bold tracking-tight sm:inline-block">
        MindVault AI
      </span>
    </Link>
  );
}
