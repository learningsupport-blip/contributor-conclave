export const THEME_COOKIE = "cc_theme";

export const THEME_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type Theme = "light" | "dark";

/** Missing or unknown values stay on the existing dark theme. */
export function parseTheme(value: string | undefined | null): Theme {
  return value === "light" ? "light" : "dark";
}

export function readThemeCookie(header: string): Theme | null {
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${THEME_COOKIE}=`));
  if (!match) {
    return null;
  }
  return parseTheme(decodeURIComponent(match.slice(THEME_COOKIE.length + 1)));
}

export function themeCookie(theme: Theme, secure: boolean): string {
  const secureFlag = secure ? "; Secure" : "";
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${THEME_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;
}
