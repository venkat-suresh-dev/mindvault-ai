export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Library",
    href: "/",
  },
  {
    label: "Add New",
    href: "/books/new",
  },
];
