import { HeroSection } from "./hero-section";
import { LibrarySection } from "./library-section";
import { auth } from "@clerk/nextjs/server";
import { getBooksForUser } from "@/features/books/services/book.service";

export async function HomePage() {
  const { userId } = await auth();
  const books = userId ? await getBooksForUser(userId) : [];

  return (
    <div>
      <HeroSection />
      <LibrarySection books={books} />
    </div>
  );
}
