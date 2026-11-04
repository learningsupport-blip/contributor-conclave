"use client";

import { useState } from "react";

import { buttonCorners, focusRing } from "@/components/ui/styles";
import { themeCookie, type Theme } from "@/lib/theme/theme";

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="3.5" />
      <path strokeLinecap="round" d="M12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5M6 6l1 1M17 17l1 1M18 6l-1 1M7 17l-1 1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.5A6.5 6.5 0 0 1 10 6.2 6.5 6.5 0 1 0 16.5 13.5Z" />
    </svg>
  );
}

export function ThemeToggle({ theme }: { theme: Theme }) {
  const [current, setCurrent] = useState(theme);
  const isDark = current === "dark";

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.cookie = themeCookie(next, window.location.protocol === "https:");
    setCurrent(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex size-10 items-center justify-center border border-ink/20 dark:border-paper/25 ${buttonCorners} ${focusRing}`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
