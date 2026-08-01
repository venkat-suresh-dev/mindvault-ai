import { NAV_ITEMS } from "@/config/navigation";
import { NavLink } from "./nav-link";

export function DesktopNav() {
  return (
    <nav
      aria-label="Main Navigation"
      className="hidden items-center gap-1 md:flex"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}
