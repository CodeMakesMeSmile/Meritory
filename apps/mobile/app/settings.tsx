import type { SettingsBody, SettingsResponse } from "@meritory/contracts";
import { space, touchTarget } from "@meritory/design-tokens";
import {
  allChapters,
  DAY_START_HOURS,
  dailySavedLine,
  dayAndYear,
  dayStartHelp,
  digitsOnly,
  ENTER_A_NUMBER,
  hourLabel,
  interviewStatusLine,
  interviewTargetHelp,
  interviewWeeksHelp,
  newCardsHelp,
  pausedTrackLine,
  RESET_DONE,
  REVIEWS_CAP_HELP,
  recallTargetHelp,
  reviewsCapLine,
  SAVE_FAILED,
  SAVE_OFFLINE,
  SETTINGS_DESCRIPTION,
  type SettingProblem,
  settledReviews,
  timeZoneLine,
  trackLimitsHelp,
  trackLimitsLine,
  wholeNumber,
} from "@meritory/recall-client";
import { useRouter } from "expo-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { DateSheet } from "../components/date-sheet";
import { Heading } from "../components/heading";
import { OptionSheet } from "../components/option-sheet";
import { Screen } from "../components/screen";
import { Segmented } from "../components/segmented";
import { TextField } from "../components/text-field";
import { TextLink } from "../components/text-link";
import { fetchContent, recallApi } from "../lib/api";
import { localToday } from "../lib/calendar";
import { useOnline } from "../lib/online";
import { useSession } from "../lib/session";
import { useTheme } from "../lib/theme";
import {
  currentThemeChoice,
  setThemeChoice,
  type ThemeChoice,
} from "../lib/theme-choice";
import { deviceTimeZone } from "../lib/time-zone";

// The phone frames word these a little shorter than the web page
const INTERVIEW_DESCRIPTION =
  "Optional. Add your date and recall gets more thorough in the weeks before it.";
const RESET_DESCRIPTION =
  "Puts every setting back to its suggested value. Your progress, interview date, and account stay as they are.";

const FOLLOW = "follow";

type Load = "loading" | "failed" | "ready";
type Notice = { tone: "success" | "danger"; text: string } | null;
type Errors = Record<string, string>;
type Track = { id: string; name: string };

const text = (value: number | null) => (value === null ? "" : String(value));

/** Every zone the phone knows, or none on an engine too old to list them */
function knownZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

function byField(problems: SettingProblem[]): Errors {
  return Object.fromEntries(problems.map((p) => [p.field, p.message]));
}

/** A section under a strong rule, like the phone frames */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: theme.borderDefault }]}>
      <View style={styles.tight}>
        <AppText variant="heading3" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="small" color="textSecondary">
          {description}
        </AppText>
      </View>
      {children}
    </View>
  );
}

/** A row under a hairline inside a section */
function Row({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: theme.borderSubtle }]}>
      {children}
    </View>
  );
}

function NoticeLine({ notice }: { notice: Notice }) {
  const theme = useTheme();
  if (!notice) return null;
  return (
    <AppText
      variant="small"
      color={notice.tone === "danger" ? "statusDanger" : undefined}
      style={
        notice.tone === "success" ? { color: theme.statusSuccess } : undefined
      }
      accessibilityLiveRegion={
        notice.tone === "danger" ? "assertive" : "polite"
      }
    >
      {notice.text}
    </AppText>
  );
}

/** A field that opens a sheet, like the day start and the interview date */
function PickField({
  id,
  label,
  value,
  hint,
  helper,
  error,
  onPress,
}: {
  id: string;
  label: string;
  value: string;
  hint: string;
  helper?: string;
  error?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="smallStrong" nativeID={`${id}-label`}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabelledBy={`${id}-label`}
        accessibilityLabel={`${label}, ${value || "none"}`}
        accessibilityHint={hint}
        onPress={onPress}
        style={[
          styles.input,
          {
            backgroundColor: theme.bgCard,
            borderColor: error ? theme.statusDanger : theme.borderDefault,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        <AppText>{value}</AppText>
      </Pressable>
      {(error || helper) && (
        <AppText
          variant="small"
          color={error ? "statusDanger" : "textSecondary"}
          accessibilityLiveRegion={error ? "assertive" : undefined}
        >
          {error ?? helper}
        </AppText>
      )}
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
  unit,
  helper,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  helper?: string;
  error?: string;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={(next) => onChange(digitsOnly(next))}
      keyboardType="number-pad"
      inputMode="numeric"
      helper={helper}
      error={error}
      trailing={
        unit ? (
          <AppText color="textSecondary" importantForAccessibility="no">
            {unit}
          </AppText>
        ) : undefined
      }
    />
  );
}

function DailyRecall({
  data,
  tracks,
  online,
  onSaved,
  onSignedOut,
}: {
  data: SettingsResponse;
  tracks: Track[];
  online: boolean;
  onSaved: (data: SettingsResponse) => void;
  onSignedOut: () => void;
}) {
  const { settings, suggested } = data;
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
  const [zone, setZone] = useState(
    settings.followDeviceTimeZone ? FOLLOW : data.timeZone,
  );
  const [sheet, setSheet] = useState<"hour" | "zone" | null>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  const device = deviceTimeZone();

  const shownNewCards = wholeNumber(newCards) ?? settings.newCardsPerDay;
  const shownTarget = wholeNumber(target) ?? settings.recallTarget;
  const trackNewLimits = Object.fromEntries(
    Object.entries(limits).flatMap(([id, value]) => {
      const limit = wholeNumber(value);
      return limit === null ? [] : [[id, limit]];
    }),
  );
  const zoneLine = timeZoneLine(
    zone === FOLLOW ? (device ?? data.timeZone) : zone,
    zone === FOLLOW,
    "phone",
  );

  async function save() {
    if (pending) return;
    setNotice(null);
    const missing: Errors = {};
    const newCardsPerDay = wholeNumber(newCards);
    const recallTarget = wholeNumber(target);
    const reviewsPerDay = capOpen ? wholeNumber(cap) : null;
    if (newCardsPerDay === null) missing.newCardsPerDay = ENTER_A_NUMBER;
    if (recallTarget === null) missing.recallTarget = ENTER_A_NUMBER;
    if (capOpen && reviewsPerDay === null)
      missing.reviewsPerDay = ENTER_A_NUMBER;
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    if (!online) {
      setNotice({ tone: "danger", text: SAVE_OFFLINE });
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
    setPending(true);
    const result = await recallApi.saveSettings(change);
    setPending(false);
    if (result.ok) {
      setErrors({});
      onSaved(result.data);
      setNotice({
        tone: "success",
        text: dailySavedLine(result.data.settings.newCardsPerDay),
      });
    } else if (result.reason === "signed_out") {
      onSignedOut();
    } else if (result.problems?.length) {
      setErrors(byField(result.problems));
    } else {
      setNotice({ tone: "danger", text: SAVE_FAILED });
    }
  }

  const known = new Set([
    // biome-ignore lint/security/noSecrets: a setting name, not a secret
    "newCardsPerDay",
    "reviewsPerDay",
    "recallTarget",
    "dayStartsAt",
    "timeZone",
  ]);
  const stray = Object.entries(errors)
    .filter(
      ([field]) => !known.has(field) && !field.startsWith("trackNewLimits."),
    )
    .map(([, message]) => message);

  return (
    <Section
      title="Daily recall"
      description="How much recall you take on each day."
    >
      <View style={styles.tight}>
        <NumberField
          label="New cards a day"
          value={newCards}
          onChange={setNewCards}
          helper={newCardsHelp(shownNewCards, suggested.newCardsPerDay)}
          error={errors.newCardsPerDay}
        />
        {newCards !== String(suggested.newCardsPerDay) && (
          <View style={styles.link}>
            <TextLink
              label="Use suggested"
              onPress={() => setNewCards(String(suggested.newCardsPerDay))}
            />
          </View>
        )}
      </View>

      <Row>
        <View style={styles.tight}>
          <AppText variant="bodyStrong">Limit per track</AppText>
          <AppText variant="small" color="textSecondary">
            {limitsOpen
              ? trackLimitsHelp(shownNewCards)
              : trackLimitsLine(trackNewLimits, shownNewCards)}
          </AppText>
        </View>
        {limitsOpen ? (
          <>
            {tracks.map((track) => {
              const value = limits[track.id] ?? "";
              return (
                <NumberField
                  key={track.id}
                  label={track.name}
                  value={value}
                  onChange={(next) =>
                    setLimits((now) => ({ ...now, [track.id]: next }))
                  }
                  helper={
                    value === "0" ? pausedTrackLine(track.name) : undefined
                  }
                  error={errors[`trackNewLimits.${track.id}`]}
                />
              );
            })}
            <View style={styles.link}>
              <TextLink
                label="Clear track limits"
                onPress={() => {
                  setLimits({});
                  setLimitsOpen(false);
                }}
              />
            </View>
          </>
        ) : (
          <Button
            label="Set per track"
            variant="secondary"
            onPress={() => setLimitsOpen(true)}
          />
        )}
      </Row>

      <Row>
        {capOpen ? (
          <View style={styles.tight}>
            <NumberField
              label="Reviews a day"
              value={cap}
              onChange={setCap}
              helper={REVIEWS_CAP_HELP}
              error={errors.reviewsPerDay}
            />
            <View style={styles.link}>
              <TextLink
                label="Remove the cap"
                onPress={() => {
                  setCap("");
                  setCapOpen(false);
                }}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.tight}>
              <AppText variant="bodyStrong">Reviews a day</AppText>
              <AppText variant="small" color="textSecondary">
                {reviewsCapLine(null)}
              </AppText>
            </View>
            <Button
              label="Set a cap"
              variant="secondary"
              onPress={() => {
                // Starts near what the new card rate settles into, inside the allowed range
                setCap(
                  String(
                    Math.min(500, Math.max(50, settledReviews(shownNewCards))),
                  ),
                );
                setCapOpen(true);
              }}
            />
          </>
        )}
      </Row>

      <Row>
        <NumberField
          label="Recall target"
          value={target}
          onChange={setTarget}
          unit="%"
          helper={recallTargetHelp(shownTarget, suggested.recallTarget)}
          error={errors.recallTarget}
        />
      </Row>

      <Row>
        <PickField
          id="day-start"
          label="Your day starts at"
          value={hourLabel(dayStart)}
          hint="Opens a list of hours"
          helper={dayStartHelp(suggested.dayStartsAt)}
          error={errors.dayStartsAt}
          onPress={() => setSheet("hour")}
        />
      </Row>

      <Row>
        <View style={styles.tight}>
          <AppText variant="bodyStrong">Time zone</AppText>
          <AppText
            variant="small"
            color={errors.timeZone ? "statusDanger" : "textSecondary"}
          >
            {errors.timeZone ?? zoneLine}
          </AppText>
        </View>
        <Button
          label="Pick a time zone"
          variant="secondary"
          onPress={() => {
            setSheet("zone");
            if (zones.length > 0) return;
            // Hermes can't list zones, so the server's own list stands in
            const local = knownZones();
            if (local.length > 0) setZones(local);
            else
              void recallApi.loadTimeZones().then((result) => {
                if (result.ok) setZones(result.data.timeZones);
              });
          }}
        />
      </Row>

      <Row>
        <NoticeLine notice={notice} />
        {stray.map((message) => (
          <AppText key={message} variant="small" color="statusDanger">
            {message}
          </AppText>
        ))}
        <Button
          label={pending ? "Saving" : "Save changes"}
          busy={pending}
          off={!online}
          onPress={() => void save()}
        />
      </Row>

      {sheet === "hour" && (
        <OptionSheet
          title="Your day starts at"
          options={DAY_START_HOURS.map((hour) => ({
            value: String(hour),
            label: hourLabel(hour),
          }))}
          value={String(dayStart)}
          onClose={() => setSheet(null)}
          onChoose={(value) => {
            setDayStart(Number(value));
            setSheet(null);
          }}
        />
      )}
      {sheet === "zone" && (
        <OptionSheet
          title="Pick a time zone"
          options={[
            {
              value: FOLLOW,
              label: `Follow this phone${device ? ` (${device})` : ""}`,
            },
            ...zones.map((name) => ({ value: name, label: name })),
          ]}
          value={zone}
          onClose={() => setSheet(null)}
          onChoose={(value) => {
            setZone(value);
            setSheet(null);
          }}
        />
      )}
    </Section>
  );
}

function InterviewDate({
  data,
  online,
  onSaved,
  onSignedOut,
}: {
  data: SettingsResponse;
  online: boolean;
  onSaved: (data: SettingsResponse) => void;
  onSignedOut: () => void;
}) {
  const { settings, suggested, interview } = data;
  // A passed date leaves the field empty, ready for a new one
  const [date, setDate] = useState<string | null>(
    interview.status === "passed" ? null : interview.date,
  );
  const [target, setTarget] = useState(String(settings.interviewTarget));
  const [weeks, setWeeks] = useState(String(settings.interviewWeeks));
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<"save" | "remove" | null>(null);

  async function send(change: SettingsBody, kind: "save" | "remove") {
    if (pending) return;
    setNotice(null);
    if (!online) {
      setNotice({ tone: "danger", text: SAVE_OFFLINE });
      return;
    }
    setPending(kind);
    const result = await recallApi.saveSettings(change);
    setPending(null);
    if (result.ok) {
      setErrors({});
      onSaved(result.data);
      if (kind === "remove") {
        setDate(null);
        setNotice({
          tone: "success",
          text: `Date removed. Recall is back to your usual ${result.data.settings.recallTarget}%.`,
        });
      }
    } else if (result.reason === "signed_out") {
      onSignedOut();
    } else if (result.problems?.length) {
      setErrors(byField(result.problems));
    } else {
      setNotice({ tone: "danger", text: SAVE_FAILED });
    }
  }

  function save() {
    const interviewTarget = wholeNumber(target);
    const interviewWeeks = wholeNumber(weeks);
    const missing: Errors = {};
    if (interviewTarget === null) missing.interviewTarget = ENTER_A_NUMBER;
    if (interviewWeeks === null) missing.interviewWeeks = ENTER_A_NUMBER;
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    void send(
      {
        interviewDate: date,
        interviewTarget: interviewTarget ?? undefined,
        interviewWeeks: interviewWeeks ?? undefined,
      },
      "save",
    );
  }

  const line = interviewStatusLine(interview, settings);
  const removable = interview.date !== null && interview.status !== "passed";
  const stray = Object.entries(errors)
    .filter(
      ([field]) =>
        !["interviewDate", "interviewTarget", "interviewWeeks"].includes(field),
    )
    .map(([, message]) => message);

  return (
    <Section title="Interview date" description={INTERVIEW_DESCRIPTION}>
      <PickField
        id="interview-date"
        label="Date of your interview"
        value={date ? dayAndYear(date) : ""}
        hint="Opens a calendar"
        error={errors.interviewDate}
        onPress={() => setPicking(true)}
      />
      <NumberField
        label="Recall target before it"
        value={target}
        onChange={setTarget}
        unit="%"
        helper={interviewTargetHelp(suggested.interviewTarget)}
        error={errors.interviewTarget}
      />
      <NumberField
        label="Weeks before"
        value={weeks}
        onChange={setWeeks}
        helper={interviewWeeksHelp(suggested.interviewWeeks)}
        error={errors.interviewWeeks}
      />
      {line && !notice && (
        <AppText
          variant="small"
          color="textSecondary"
          accessibilityLiveRegion="polite"
        >
          {line}
        </AppText>
      )}
      <Row>
        <NoticeLine notice={notice} />
        {stray.map((message) => (
          <AppText key={message} variant="small" color="statusDanger">
            {message}
          </AppText>
        ))}
        <Button
          label={pending === "save" ? "Saving" : "Save changes"}
          busy={pending !== null}
          off={!online}
          onPress={save}
        />
        {removable && (
          <Button
            label={pending === "remove" ? "Removing" : "Remove date"}
            variant="secondary"
            busy={pending !== null}
            off={!online}
            onPress={() => void send({ interviewDate: null }, "remove")}
          />
        )}
      </Row>
      {picking && (
        <DateSheet
          open
          value={date}
          today={localToday()}
          onClose={() => setPicking(false)}
          onChoose={(next) => {
            setDate(next);
            setErrors(({ interviewDate: _, ...rest }) => rest);
            setPicking(false);
          }}
        />
      )}
    </Section>
  );
}

function ResetConfirm({
  data,
  pending,
  onConfirm,
  onClose,
}: {
  data: SettingsResponse;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { suggested } = data;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBack}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            { backgroundColor: theme.bgCard, borderColor: theme.borderDefault },
          ]}
        >
          <AppText variant="heading3" accessibilityRole="header">
            Reset all settings?
          </AppText>
          <AppText variant="small" color="textSecondary">
            Every setting goes back to its suggested value, like{" "}
            {suggested.newCardsPerDay} new cards a day and a{" "}
            {suggested.recallTarget}% recall target. Your progress, interview
            date, and account stay as they are.
          </AppText>
          <Button
            label={pending ? "Resetting" : "Reset all settings"}
            busy={pending}
            onPress={onConfirm}
          />
          <Button label="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export default function Settings() {
  const router = useRouter();
  const online = useOnline();
  const { signOut } = useSession();
  const [load, setLoad] = useState<Load>("loading");
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [theme, setTheme] = useState<ThemeChoice>("system");
  // A reset starts every section again from what was saved
  const [version, setVersion] = useState(0);
  const [asking, setAsking] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<Notice>(null);

  const read = useCallback(async () => {
    setLoad("loading");
    const [settings, content] = await Promise.all([
      recallApi.loadSettings(),
      fetchContent(),
    ]);
    if (settings.ok) {
      setData(settings.data);
      if (content.ok) {
        setTracks([
          ...new Map(
            allChapters(content.content).map(({ track }) => [
              track.id,
              { id: track.id, name: track.title },
            ]),
          ).values(),
        ]);
      }
      setLoad("ready");
    } else if (settings.reason === "signed_out") {
      signOut();
    } else {
      setLoad("failed");
    }
  }, [signOut]);

  useEffect(() => {
    void read();
  }, [read]);

  useEffect(() => {
    void currentThemeChoice().then(setTheme);
  }, []);

  async function reset() {
    if (!online) {
      setAsking(false);
      setResetNotice({ tone: "danger", text: SAVE_OFFLINE });
      return;
    }
    setResetting(true);
    const result = await recallApi.resetSettings();
    setResetting(false);
    setAsking(false);
    if (result.ok) {
      await setThemeChoice("system");
      setTheme("system");
      setData(result.data);
      setVersion((now) => now + 1);
      setResetNotice({ tone: "success", text: RESET_DONE });
    } else if (result.reason === "signed_out") {
      signOut();
    } else {
      setResetNotice({ tone: "danger", text: SAVE_FAILED });
    }
  }

  return (
    <Screen bare>
      <View style={styles.back}>
        <TextLink label="Back to Home" onPress={() => router.replace("/")} />
      </View>
      <Heading title="Settings">
        <AppText color="textSecondary">{SETTINGS_DESCRIPTION}</AppText>
      </Heading>

      {load === "loading" && (
        <AppText
          variant="small"
          color="textSecondary"
          accessibilityLiveRegion="polite"
        >
          Loading your settings
        </AppText>
      )}

      {load === "failed" && (
        <View style={styles.block}>
          <Alert
            tone="danger"
            text="We couldn't load your settings. Check your connection, then try again."
          />
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => void read()}
          />
        </View>
      )}

      {load === "ready" && data && (
        <View style={styles.block}>
          {!online && <Alert tone="info" text={SAVE_OFFLINE} />}
          <DailyRecall
            key={`daily-${version}`}
            data={data}
            tracks={tracks}
            online={online}
            onSaved={setData}
            onSignedOut={signOut}
          />
          <InterviewDate
            key={`interview-${version}`}
            data={data}
            online={online}
            onSaved={setData}
            onSignedOut={signOut}
          />
          <Section
            title="On this phone"
            description="These save as soon as you pick, and only for this phone."
          >
            <Segmented<ThemeChoice>
              label="Theme"
              value={theme}
              onChange={(next) => {
                setTheme(next);
                void setThemeChoice(next);
              }}
              segments={[
                { value: "system", label: "Match system", suggested: true },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Section>
          <Section title="Reset all" description={RESET_DESCRIPTION}>
            <NoticeLine notice={resetNotice} />
            <Button
              label="Reset all settings"
              variant="secondary"
              onPress={() => {
                setResetNotice(null);
                setAsking(true);
              }}
            />
          </Section>
          {asking && (
            <ResetConfirm
              data={data}
              pending={resetting}
              onConfirm={() => void reset()}
              onClose={() => setAsking(false)}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: touchTarget, justifyContent: "center" },
  block: { gap: space[6] },
  section: { gap: space[4], borderTopWidth: 1, paddingTop: space[5] },
  row: { gap: space[3], borderTopWidth: 1, paddingTop: space[4] },
  tight: { gap: space[1] },
  field: { gap: space[2] },
  link: { alignItems: "flex-start" },
  input: {
    minHeight: touchTarget,
    justifyContent: "center",
    paddingHorizontal: space[3],
  },
  dialogBack: {
    flex: 1,
    justifyContent: "center",
    padding: space[6],
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  dialog: { gap: space[4], borderWidth: 1, padding: space[6] },
});
