"use client";

import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

type ThemeOption = "light" | "dark" | "system";

const themeOptions: Array<{
  value: ThemeOption;
  label: string;
  Icon: typeof Sun;
  iconClassName: string;
}> = [
  {
    value: "light",
    label: "Light",
    Icon: Sun,
    iconClassName: "group-hover:rotate-45",
  },
  {
    value: "dark",
    label: "Dark",
    Icon: Moon,
    iconClassName: "group-hover:-rotate-12",
  },
  {
    value: "system",
    label: "System",
    Icon: Monitor,
    iconClassName: "group-hover:scale-110",
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Required for next-themes hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-xl"
        aria-hidden="true"
      />
    );
  }

  const selectedTheme = (theme ?? "system") as ThemeOption;

  const selectedOption =
    themeOptions.find((option) => option.value === selectedTheme) ??
    themeOptions[2];

  const SelectedIcon = selectedOption.Icon;

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="group text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring size-8 rounded-xl transition-all focus-visible:ring-2"
        aria-label="Change appearance"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <SelectedIcon
          className={`size-4 transition-transform duration-200 ${selectedOption.iconClassName} `}
        />
      </Button>

      {open && (
        <div
          role="menu"
          className="border-border bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-40 rounded-xl border p-1 shadow-lg"
        >
          <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Appearance
          </p>

          {themeOptions.map(({ value, label, Icon }) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              className="group text-muted-foreground hover:bg-accent hover:text-foreground flex h-9 w-full justify-start gap-2 rounded-lg"
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
            >
              <Icon className="size-4 transition-transform group-hover:scale-110" />

              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
