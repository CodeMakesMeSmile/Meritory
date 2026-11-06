import { themeStylesheet } from "@meritory/design-tokens";
import type { Metadata } from "next";
import { Host_Grotesk, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
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

export const metadata: Metadata = {
  title: "Meritory",
  description: "Practice for senior engineering interviews.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static token CSS built from our own package */}
        <style dangerouslySetInnerHTML={{ __html: themeStylesheet() }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
