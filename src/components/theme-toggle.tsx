"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  variant?: "sidebar" | "icon";
}

export function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");
  const Icon = isDark ? Sun : Moon;

  if (variant === "sidebar") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={toggle}
      >
        <Icon className="h-4 w-4" />
        {isDark ? "Light mode" : "Dark mode"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
