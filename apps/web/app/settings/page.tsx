import { SETTINGS_DESCRIPTION } from "@meritory/recall-client";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { allChapters } from "@/lib/content";
import { getContent, getSettings, requireMe } from "@/lib/server-api";
import { readTheme, THEME_COOKIE } from "@/lib/theme";
import { SettingsCards } from "./settings-cards";

export const metadata: Metadata = { title: "Settings · Meritory" };

export default async function SettingsPage() {
  const [me, settings, content, jar] = await Promise.all([
    requireMe("/settings"),
    getSettings("/settings"),
    getContent("/settings"),
    cookies(),
  ]);
  const tracks = [
    ...new Map(
      allChapters(content).map(({ track }) => [
        track.id,
        { id: track.id, name: track.title },
      ]),
    ).values(),
  ];
  return (
    <AppShell page="settings" user={me}>
      <div className="mx-auto flex w-full max-w-180 flex-col gap-6 md:mx-0">
        <header className="flex flex-col gap-1">
          <h1 className="text-display">Settings</h1>
          <p className="text-small text-secondary">{SETTINGS_DESCRIPTION}</p>
        </header>
        <SettingsCards
          initial={settings}
          tracks={tracks}
          theme={readTheme(jar.get(THEME_COOKIE)?.value)}
        />
      </div>
    </AppShell>
  );
}
