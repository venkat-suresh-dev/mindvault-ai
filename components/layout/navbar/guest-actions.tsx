"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

interface GuestActionsProps {
  isMobile?: boolean;
}

export function GuestActions({ isMobile }: GuestActionsProps) {
  return (
    <div
      className={cn(
        "flex",
        isMobile ? "w-full flex-col gap-3" : "items-center gap-4",
      )}
    >
      <SignUpButton mode="modal">
        <Button
          className={cn(
            "h-11 px-6 font-medium transition-shadow hover:shadow-md",
            isMobile && "w-full",
          )}
        >
          Register
        </Button>
      </SignUpButton>

      <SignInButton mode="modal">
        <Button
          variant="outline"
          className={cn(
            "hover:bg-accent hover:text-accent-foreground h-11 px-6 font-medium transition-colors",
            isMobile && "w-full",
          )}
        >
          Sign In
        </Button>
      </SignInButton>
    </div>
  );
}
