import { themeStylesheet } from "@meritory/design-tokens";
import type { Metadata } from "next";

import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { NONCE_HEADER } from "@/lib/csp";
import { readTheme, THEME_COOKIE } from "@/lib/theme";
import { FONT_CLASSES } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meritory",
  description: "Practice for senior engineering interviews.",
};

// Reading the nonce renders every page per request, which a nonce needs
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;
  const theme = readTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="en"
      className={FONT_CLASSES}
      data-theme={theme === "system" ? undefined : theme}
    >
      <head>
        <style
          nonce={nonce}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static token CSS built from our own package
          dangerouslySetInnerHTML={{ __html: themeStylesheet() }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
