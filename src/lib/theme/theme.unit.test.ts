import { describe, expect, it } from "vitest";

import { parseTheme, readThemeCookie, themeCookie, THEME_MAX_AGE_SECONDS } from "@/lib/theme/theme";

describe("theme preference", () => {
  it("keeps the current dark theme unless light is stored", () => {
    expect(parseTheme(undefined)).toBe("dark");
    expect(parseTheme(null)).toBe("dark");
    expect(parseTheme("")).toBe("dark");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
  });

  it("reads only the theme cookie from a cookie header", () => {
    expect(readThemeCookie("")).toBeNull();
    expect(readThemeCookie("cc_session=abc")).toBeNull();
    expect(readThemeCookie("cc_session=abc; cc_theme=light")).toBe("light");
    expect(readThemeCookie("cc_theme=nope")).toBe("dark");
  });

  it("writes a year-long lax cookie and marks it secure only on https", () => {
    expect(themeCookie("light", false)).toBe(
      `cc_theme=light; Path=/; Max-Age=${THEME_MAX_AGE_SECONDS}; SameSite=Lax`,
    );
    expect(themeCookie("dark", true)).toBe(
      `cc_theme=dark; Path=/; Max-Age=${THEME_MAX_AGE_SECONDS}; SameSite=Lax; Secure`,
    );
  });
});
