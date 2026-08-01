import Image from "next/image";

interface HeroIllustrationProps {
  src: string;
  alt: string;
}

export function HeroIllustration({ src, alt }: HeroIllustrationProps) {
  return (
    <div className="border-border bg-card relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border p-2 shadow-lg">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 639px) 90vw, (max-width: 1023px) 24rem, 21rem"
        className="rounded-xl object-cover"
      />
      <div className="from-background/40 pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t to-transparent" />
    </div>
  );
}
