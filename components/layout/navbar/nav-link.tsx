"use client";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavLinkProps extends Omit<NavItem, "icon"> {
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavLink({ label, href, icon, className, onClick }: NavLinkProps) {
  const pathname = usePathname();

  // Root path requires exact match. Nested paths match via startsWith.
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isActive
          ? "text-foreground bg-accent/50 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}
