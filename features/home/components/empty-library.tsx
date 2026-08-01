import { Button } from "@/components/ui/button";
import { HOME_CONTENT } from "@/features/home/constants/home-content";
import { BookPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function EmptyLibrary() {
  const { emptyLibrary, hero } = HOME_CONTENT;

  return (
    <div className="border-border bg-card grid place-items-center rounded-2xl border px-6 py-10 text-center sm:px-10">
      <Image
        src={hero.illustration.src}
        alt=""
        width={128}
        height={160}
        className="rounded-xl object-cover"
      />
      <h3 className="mt-5 text-xl font-semibold">{emptyLibrary.title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md leading-6">
        {emptyLibrary.description}
      </p>
      <Button asChild className="mt-6">
        <Link href="/books/new">
          <BookPlus aria-hidden="true" />
          {emptyLibrary.action}
        </Link>
      </Button>
    </div>
  );
}
