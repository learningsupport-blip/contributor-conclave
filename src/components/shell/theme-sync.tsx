"use client";

import { useLayoutEffect } from "react";

import { readThemeCookie, type Theme } from "@/lib/theme/theme";

/** Reapplies the saved theme after a render so the html class stays with the cookie. */
export function ThemeSync({ theme }: { theme: Theme }) {
  useLayoutEffect(() => {
    const saved = readThemeCookie(document.cookie);
    const current = saved ?? theme;
    document.documentElement.classList.toggle("dark", current === "dark");
  });

  return null;
}
