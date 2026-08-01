import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface UserProfileProps {
  displayName: string;
}

export function UserProfile({ displayName }: UserProfileProps) {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/subscription"
        aria-label="Manage Subscription"
        className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors md:inline-block"
      >
        {displayName}
      </Link>
      <UserButton
        appearance={{
          elements: {
            avatarBox:
              "h-10 w-10 rounded-full ring-2 ring-primary/10 transition-shadow hover:ring-primary/30",
          },
        }}
      />
    </div>
  );
}
