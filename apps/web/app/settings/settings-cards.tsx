"use client";

import { useState } from "react";
import { setShortcutsOn } from "@/lib/device-storage";
import type { SettingsResponse } from "@/lib/recall-api";
import { setTheme, type Theme } from "@/lib/theme";
import { DailyCard, type TrackName } from "./daily-card";
import { DeviceCard } from "./device-card";
import { InterviewCard } from "./interview-card";
import { PracticeCard } from "./practice-card";
import { ResetCard } from "./reset-card";

/** The cards share the saved settings, so a reset reaches every one */
export function SettingsCards({
  initial,
  tracks,
  theme: initialTheme,
}: {
  initial: SettingsResponse;
  tracks: TrackName[];
  theme: Theme;
}) {
  const [data, setData] = useState(initial);
  const [theme, setThemeState] = useState(initialTheme);
  // A reset starts every card again from what was saved
  const [version, setVersion] = useState(0);

  return (
    <>
      <DailyCard
        key={`daily-${version}`}
        data={data}
        tracks={tracks}
        onSaved={setData}
      />
      <InterviewCard
        key={`interview-${version}`}
        data={data}
        onSaved={setData}
      />
      <PracticeCard key={`practice-${version}`} data={data} onSaved={setData} />
      <DeviceCard
        key={`device-${version}`}
        theme={theme}
        onTheme={setThemeState}
      />
      <ResetCard
        data={data}
        onReset={(next) => {
          setShortcutsOn(true);
          setTheme("system");
          setThemeState("system");
          setData(next);
          setVersion((now) => now + 1);
        }}
      />
    </>
  );
}
