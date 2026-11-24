"use client";

import {
  DAY_START_HOURS,
  dailySavedLine,
  dayStartHelp,
  ENTER_A_NUMBER,
  hourLabel,
  newCardsHelp,
  pausedTrackLine,
  REVIEWS_CAP_HELP,
  recallTargetHelp,
  reviewsCapLine,
  settledReviews,
  timeZoneLine,
  trackLimitsHelp,
  trackLimitsLine,
  wholeNumber,
} from "@meritory/recall-client";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { browserTimeZone } from "@/components/time-zone-sync";
import type { SettingsBody, SettingsResponse } from "@/lib/recall-api";
import { Card, Row } from "../account/card";
import {
  Footer,
  NumberField,
  OfflineAlert,
  SummaryRow,
  strayErrors,
  TextButton,
} from "./parts";
import { useOnline, useSave } from "./use-save";

export interface TrackName {
  id: string;
  name: string;
}

const FOLLOW = "follow";

/** Every zone the browser knows, or none on one too old to list them */
function knownZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

const text = (value: number | null) => (value === null ? "" : String(value));

const CARD_FIELDS = new Set([
  // biome-ignore lint/security/noSecrets: a setting name, not a secret
  "newCardsPerDay",
  "reviewsPerDay",
  "recallTarget",
  "dayStartsAt",
  "timeZone",
]);

/** New cards, track limits, the reviews cap, the target, the day start, and the time zone */
export function DailyCard({
  data,
  tracks,
  onSaved,
}: {
  data: SettingsResponse;
  tracks: TrackName[];
  onSaved: (data: SettingsResponse) => void;
}) {
  const { settings, suggested } = data;
  const online = useOnline();
  const { save, pending, notice, errors, setErrors } = useSave(onSaved);
  const [newCards, setNewCards] = useState(text(settings.newCardsPerDay));
  const [limits, setLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(settings.trackNewLimits).map(([id, n]) => [id, text(n)]),
    ),
  );
  const [limitsOpen, setLimitsOpen] = useState(
    Object.keys(settings.trackNewLimits).length > 0,
  );
  const [cap, setCap] = useState(text(settings.reviewsPerDay));
  const [capOpen, setCapOpen] = useState(settings.reviewsPerDay !== null);
  const [target, setTarget] = useState(text(settings.recallTarget));
  const [dayStart, setDayStart] = useState(settings.dayStartsAt);
  const [zoneOpen, setZoneOpen] = useState(false);
  // Following, or the zone picked from the list
  const [zone, setZone] = useState(
    settings.followDeviceTimeZone ? FOLLOW : data.timeZone,
  );
  const zones = useMemo(() => (zoneOpen ? knownZones() : []), [zoneOpen]);
  // Read after the first paint, since the server doesn't know the browser's zone
  const [device, setDevice] = useState<string | null>(null);
  useEffect(() => setDevice(browserTimeZone()), []);

  const shownNewCards = wholeNumber(newCards) ?? settings.newCardsPerDay;
  const shownTarget = wholeNumber(target) ?? settings.recallTarget;
  // An empty track field means no limit of its own
  const trackNewLimits = Object.fromEntries(
    Object.entries(limits).flatMap(([id, value]) => {
      const limit = wholeNumber(value);
      return limit === null ? [] : [[id, limit]];
    }),
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const missing: Record<string, string> = {};
    const newCardsPerDay = wholeNumber(newCards);
    if (newCardsPerDay === null) missing.newCardsPerDay = ENTER_A_NUMBER;
    const recallTarget = wholeNumber(target);
    if (recallTarget === null) missing.recallTarget = ENTER_A_NUMBER;
    const reviewsPerDay = capOpen ? wholeNumber(cap) : null;
    if (capOpen && reviewsPerDay === null)
      missing.reviewsPerDay = ENTER_A_NUMBER;
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    const change: SettingsBody = {
      newCardsPerDay: newCardsPerDay ?? undefined,
      trackNewLimits,
      reviewsPerDay,
      recallTarget: recallTarget ?? undefined,
      dayStartsAt: dayStart,
      followDeviceTimeZone: zone === FOLLOW,
    };
    const picked = zone === FOLLOW ? device : zone;
    if (picked) change.timeZone = picked;
    const saved = await save(change, (next) =>
      dailySavedLine(next.settings.newCardsPerDay),
    );
    if (saved) setZoneOpen(false);
  }

  const zoneLine = timeZoneLine(
    zone === FOLLOW ? (device ?? data.timeZone) : zone,
    zone === FOLLOW,
    "device",
  );

  return (
    <Card
      title="Daily recall"
      description="How much recall you take on each day."
    >
      <OfflineAlert online={online} />
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <NumberField
            id="new-cards"
            label="New cards a day"
            value={newCards}
            onChange={setNewCards}
            helper={newCardsHelp(shownNewCards, suggested.newCardsPerDay)}
            error={errors.newCardsPerDay}
          />
          {newCards !== String(suggested.newCardsPerDay) && (
            <TextButton
              onClick={() => setNewCards(String(suggested.newCardsPerDay))}
            >
              Use suggested
            </TextButton>
          )}
        </div>

        {limitsOpen ? (
          <Row className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-body font-semibold">Limit per track</h3>
              <p className="text-small text-secondary">
                {trackLimitsHelp(shownNewCards)}
              </p>
            </div>
            {tracks.map((track) => {
              const value = limits[track.id] ?? "";
              const field = `trackNewLimits.${track.id}`;
              return (
                <NumberField
                  key={track.id}
                  id={`limit-${track.id}`}
                  label={track.name}
                  value={value}
                  onChange={(next) =>
                    setLimits((now) => ({ ...now, [track.id]: next }))
                  }
                  helper={
                    value === "0" ? pausedTrackLine(track.name) : undefined
                  }
                  error={errors[field]}
                />
              );
            })}
            <TextButton
              onClick={() => {
                setLimits({});
                setLimitsOpen(false);
              }}
            >
              Clear track limits
            </TextButton>
          </Row>
        ) : (
          <SummaryRow
            title="Limit per track"
            line={trackLimitsLine(trackNewLimits, shownNewCards)}
            action="Set per track"
            onAction={() => setLimitsOpen(true)}
          />
        )}

        {capOpen ? (
          <Row className="flex flex-col gap-1">
            <NumberField
              id="reviews-cap"
              label="Reviews a day"
              value={cap}
              onChange={setCap}
              helper={REVIEWS_CAP_HELP}
              error={errors.reviewsPerDay}
            />
            <TextButton
              onClick={() => {
                setCap("");
                setCapOpen(false);
              }}
            >
              Remove the cap
            </TextButton>
          </Row>
        ) : (
          <SummaryRow
            title="Reviews a day"
            line={reviewsCapLine(null)}
            action="Set a cap"
            onAction={() => {
              // Starts near what the new card rate settles into, inside the allowed range
              setCap(
                String(
                  Math.min(500, Math.max(50, settledReviews(shownNewCards))),
                ),
              );
              setCapOpen(true);
            }}
          />
        )}

        <Row>
          <NumberField
            id="recall-target"
            label="Recall target"
            value={target}
            onChange={setTarget}
            unit="%"
            helper={recallTargetHelp(shownTarget, suggested.recallTarget)}
            error={errors.recallTarget}
          />
        </Row>

        <Row className="flex flex-col gap-2 sm:*:max-w-80">
          <label htmlFor="day-start" className="text-small font-semibold">
            Your day starts at
          </label>
          <div className="field-box">
            <select
              id="day-start"
              value={dayStart}
              onChange={(event) => setDayStart(Number(event.target.value))}
              aria-describedby="day-start-helper"
              className="text-body text-primary"
            >
              {DAY_START_HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </select>
          </div>
          <p id="day-start-helper" className="text-small text-secondary">
            {errors.dayStartsAt ?? dayStartHelp(suggested.dayStartsAt)}
          </p>
        </Row>

        {zoneOpen ? (
          <Row className="flex flex-col gap-2 sm:*:max-w-80">
            <label htmlFor="time-zone" className="text-small font-semibold">
              Time zone
            </label>
            <div
              className="field-box"
              data-invalid={errors.timeZone ? "" : undefined}
            >
              <select
                id="time-zone"
                value={zone}
                onChange={(event) => setZone(event.target.value)}
                aria-describedby="time-zone-helper"
                className="text-body text-primary"
              >
                <option value={FOLLOW}>
                  Follow this device{device ? ` (${device})` : ""}
                </option>
                {zones.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <p
              id="time-zone-helper"
              className={`text-small ${errors.timeZone ? "text-danger" : "text-secondary"}`}
            >
              {errors.timeZone ?? zoneLine}
            </p>
          </Row>
        ) : (
          <SummaryRow
            title="Time zone"
            line={zoneLine}
            action="Pick a time zone"
            onAction={() => setZoneOpen(true)}
          />
        )}

        <Footer
          notice={notice}
          pending={pending}
          online={online}
          stray={strayErrors(
            errors,
            (field) =>
              CARD_FIELDS.has(field) || field.startsWith("trackNewLimits."),
          )}
        />
      </form>
    </Card>
  );
}
