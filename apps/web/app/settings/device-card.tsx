"use client";

import { useEffect, useState } from "react";
import { Segmented } from "@/components/segmented";
import { setShortcutsOn, shortcutsOn } from "@/lib/device-storage";
import { setTheme, type Theme } from "@/lib/theme";
import { Card } from "../account/card";

type Shortcuts = "on" | "off";

/** Picks kept in this browser only, saved the moment they change */
export function DeviceCard({
  theme,
  onTheme,
}: {
  theme: Theme;
  onTheme: (theme: Theme) => void;
}) {
  const [shortcuts, setShortcuts] = useState<Shortcuts>("on");
  // Storage is only there in the browser, so this reads after the first paint
  useEffect(() => setShortcuts(shortcutsOn() ? "on" : "off"), []);

  return (
    <Card
      title="On this device"
      description="These save as soon as you pick, and only for this browser."
    >
      <Segmented<Shortcuts>
        label="Keyboard shortcuts"
        value={shortcuts}
        onChange={(next) => {
          setShortcuts(next);
          setShortcutsOn(next === "on");
        }}
        segments={[
          { value: "on", label: "On", suggested: true },
          { value: "off", label: "Off" },
        ]}
      />
      <Segmented<Theme>
        label="Theme"
        value={theme}
        onChange={(next) => {
          setTheme(next);
          onTheme(next);
        }}
        segments={[
          { value: "system", label: "Match system", suggested: true },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
    </Card>
  );
}
