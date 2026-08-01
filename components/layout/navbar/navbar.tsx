import type { User } from "@clerk/nextjs/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentUser } from "@clerk/nextjs/server";
import { AuthSection } from "./auth-section";
import { DesktopNav } from "./desktop-nav";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

// Type-safe, fallback-heavy name extraction replacing 'any' with Clerk's User type
function getUserDisplayName(user: User | null): string {
  if (!user) return "Account";
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if (user.emailAddresses?.[0]?.emailAddress) {
    return user.emailAddresses[0].emailAddress.split("@")[0];
  }
  return "Account";
}

export async function Navbar() {
  const user = await currentUser();
  const displayName = getUserDisplayName(user);

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <MobileNav displayName={displayName} />
          <Logo />
          <DesktopNav />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <AuthSection displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
