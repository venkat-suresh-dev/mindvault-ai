import type { Citation } from "@/features/chat/types/chat";
import { FileText } from "lucide-react";

export function CitationList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;
  return <section className="border-border mt-5 border-t pt-4" aria-label="Sources"><h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"><FileText className="size-3.5" />Sources</h3><ul className="mt-2.5 flex flex-wrap gap-2">{citations.map((citation) => <li key={citation.segmentId} className="border-border bg-muted/60 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium"><FileText aria-hidden="true" className="text-primary size-3" />Page {citation.page}</li>)}</ul></section>;
}
