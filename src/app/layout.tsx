import { Navbar } from "@/components/shell/navbar";
import { RequestRecorder } from "@/components/shell/request-recorder";
import { RouteFocus } from "@/components/shell/route-focus";
import { Sidebar } from "@/components/shell/sidebar";
import { SiteFooter } from "@/components/shell/site-footer";
import { ThemeSync } from "@/components/shell/theme-sync";
import { signedInNavItems } from "@/components/shell/workspace-items";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { readAuthorProfile } from "@/lib/site/author";
import { parseTheme, THEME_COOKIE } from "@/lib/theme/theme";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Contributor Conclave",
    template: "%s · Contributor Conclave",
  },
  description: "Mentorship around GitHub contributions and pull-request review.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased${theme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeSync theme={theme} />
        <a
          href="#content"
          className={`sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:bg-paper focus:px-3 focus:py-2 focus:text-ink ${buttonCorners} ${focusRing}`}
        >
          Skip to content
        </a>
        <Suspense fallback={null}>
          <RouteFocus />
        </Suspense>
        <RequestRecorder user={user} />
        <Navbar user={user} theme={theme} />
        <div className="flex min-h-0 flex-1">
          {user ? <Sidebar label="Account" items={signedInNavItems(user.role)} /> : null}
          <div id="content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
            {children}
          </div>
        </div>
        <SiteFooter author={readAuthorProfile()} />
      </body>
    </html>
  );
}
