"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/config/navigation";
import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import { CreditCard, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { GuestActions } from "./guest-actions";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";

interface MobileNavProps {
  displayName: string;
}

export function MobileNav({ displayName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open main menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="bg-background/95 flex w-[85vw] max-w-sm flex-col border-r border-border/40 p-0 backdrop-blur-xl sm:w-96"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

          {/* Header */}
          <SheetHeader className="border-b border-border/40 px-6 py-5 text-left">
            <div className="flex items-center justify-between" onClick={() => setIsOpen(false)}>
              <Logo />
            </div>
          </SheetHeader>

          {/* Body Content */}
          <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
            {/* Primary Navigation */}
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
              <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Menu
              </span>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-base font-medium transition-all hover:bg-accent/70 hover:text-accent-foreground active:scale-[0.98]"
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </nav>

            <div className="mt-8 border-t border-border pt-6">
              <div className="flex items-center justify-between rounded-xl bg-muted p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Appearance</p>
                  <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Authentication & Profile Section */}
            <div className="mt-8 border-t border-border pt-6">
              <Show when="signed-out">
                <div className="px-2">
                  <GuestActions isMobile />
                </div>
              </Show>

              <Show when="signed-in">
                <div className="flex flex-col gap-4">
                  {/* Modern User Profile Badge */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-3 shadow-xs backdrop-blur-xs">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "h-11 w-11 ring-2 ring-background shadow-xs",
                        },
                      }}
                    />
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Account active
                      </span>
                    </div>
                  </div>

                  {/* Account Options */}
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Account
                    </span>

                    <NavLink
                      href="/subscription"
                      label="Subscription"
                      icon={<CreditCard className="mr-2.5 h-4 w-4 text-muted-foreground" />}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent/70 hover:text-accent-foreground"
                      onClick={() => setIsOpen(false)}
                    />

                    <SignOutButton>
                      <button className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                        <LogOut className="mr-2.5 h-4 w-4" />
                        Sign Out
                      </button>
                    </SignOutButton>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
