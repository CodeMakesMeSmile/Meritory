import { themeStylesheet } from "@meritory/design-tokens";
import type { Metadata } from "next";
import { Host_Grotesk, IBM_Plex_Mono, Roboto } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { NONCE_HEADER } from "@/lib/csp";
import "./globals.css";

const sans = Host_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-host-grotesk",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// Only the provider buttons use it, as Google's sign-in guidelines ask
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-roboto",
});

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
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${roboto.variable}`}
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
