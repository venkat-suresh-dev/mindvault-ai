import { BookOpen } from "lucide-react";

interface BookFallbackCoverProps {
  title: string;
  author?: string | null;
}

const COVER_TREATMENTS = [
  "from-chart-1/40 via-primary/20 to-background",
  "from-chart-2/40 via-accent/35 to-background",
  "from-chart-3/40 via-secondary to-background",
  "from-chart-4/45 via-accent/25 to-background",
  "from-chart-5/40 via-primary/15 to-background",
] as const;

function getStableCoverIndex(title: string, author?: string | null): number {
  const value = `${title}:${author ?? ""}`;
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % COVER_TREATMENTS.length;
}

export function BookFallbackCover({ title, author }: BookFallbackCoverProps) {
  const treatment = COVER_TREATMENTS[getStableCoverIndex(title, author)];

  return (
    <div className={`relative flex size-full overflow-hidden bg-gradient-to-br p-[7%] ${treatment}`}>
      <div className="border-primary-foreground/20 bg-background/10 absolute inset-[7%] rounded-sm border" aria-hidden="true" />
      <div className="bg-primary-foreground/20 absolute inset-y-0 left-[8%] w-px" aria-hidden="true" />
      <div className="relative flex min-w-0 flex-1 flex-col justify-between rounded-sm px-[9%] py-[10%] text-foreground">
        <BookOpen className="text-foreground/75 size-[18%] min-h-6 min-w-6" aria-hidden="true" />
        <div className="min-w-0">
          <div className="bg-foreground/25 mb-[10%] h-px w-9" aria-hidden="true" />
          <p className="line-clamp-4 text-[clamp(0.8rem,4vw,1.35rem)] leading-[1.12] font-bold tracking-tight text-balance">
            {title}
          </p>
          {author && <p className="text-muted-foreground mt-[8%] line-clamp-2 text-[clamp(0.65rem,2.4vw,0.9rem)] font-medium">{author}</p>}
        </div>
      </div>
    </div>
  );
}
