import type { InterviewDateResponse } from "@meritory/contracts";
import { space, touchTarget } from "@meritory/design-tokens";
import {
  dayAndYear,
  INTERVIEW_DESCRIPTION,
  INTERVIEW_ERRORS,
  interviewStatusLine,
} from "@meritory/recall-client";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Alert } from "../components/alert";
import { AppText } from "../components/app-text";
import { Button } from "../components/button";
import { DateSheet } from "../components/date-sheet";
import { Heading } from "../components/heading";
import { Screen } from "../components/screen";
import { TextLink } from "../components/text-link";
import { recallApi } from "../lib/api";
import { localToday } from "../lib/calendar";
import { useOnline } from "../lib/online";
import { useSession } from "../lib/session";
import { useTheme } from "../lib/theme";

const OFFLINE = "You're offline. This needs a connection.";
const FAILED = "Something went wrong on our side. Try again in a moment.";
const PASSED = "That date has passed. Pick a date after today.";
const NOT_A_DATE = "That isn't a date. Pick one from the calendar.";

type Load = "loading" | "failed" | "ready";
type Notice = { tone: "success" | "danger"; text: string };

export default function InterviewDate() {
  const router = useRouter();
  const theme = useTheme();
  const online = useOnline();
  const { signOut } = useSession();
  const [load, setLoad] = useState<Load>("loading");
  const [state, setState] = useState<InterviewDateResponse | null>(null);
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<"save" | "remove" | null>(null);
  const [picking, setPicking] = useState(false);

  const show = useCallback((next: InterviewDateResponse) => {
    setState(next);
    // A passed date leaves the field empty, ready for a new one
    setValue(next.status === "passed" ? null : next.date);
  }, []);

  const read = useCallback(async () => {
    setLoad("loading");
    const result = await recallApi.loadInterviewDate();
    if (result.ok) {
      show(result.data);
      setLoad("ready");
    } else if (result.reason === "signed_out") {
      signOut();
    } else {
      setLoad("failed");
    }
  }, [show, signOut]);

  useEffect(() => {
    void read();
  }, [read]);

  async function send(date: string | null) {
    setNotice(null);
    setError(null);
    if (!online) {
      setNotice({ tone: "danger", text: OFFLINE });
      return;
    }
    setPending(date === null ? "remove" : "save");
    const result = await recallApi.saveInterviewDate(date);
    setPending(null);
    if (result.ok) {
      show(result.data);
      if (date === null) {
        setNotice({
          tone: "success",
          text: "Date removed. Recall is back to its usual 90%.",
        });
      }
      return;
    }
    if (result.reason === "signed_out") signOut();
    else if (result.code === INTERVIEW_ERRORS.datePassed) setError(PASSED);
    else if (result.code === INTERVIEW_ERRORS.notADate) setError(NOT_A_DATE);
    else setNotice({ tone: "danger", text: FAILED });
  }

  function save() {
    if (pending) return;
    if (!value) {
      setError("Pick a date first.");
      return;
    }
    void send(value);
  }

  const line = state ? interviewStatusLine(state) : null;
  const removable =
    state !== null && state.date !== null && state.status !== "passed";

  return (
    <Screen bare>
      <View style={styles.back}>
        <TextLink label="Back to Home" onPress={() => router.replace("/")} />
      </View>
      <Heading title="Interview date">
        <AppText color="textSecondary">{INTERVIEW_DESCRIPTION}</AppText>
      </Heading>

      {load === "loading" && (
        <AppText
          variant="small"
          color="textSecondary"
          accessibilityLiveRegion="polite"
        >
          Loading your date
        </AppText>
      )}

      {load === "failed" && (
        <View style={styles.block}>
          <Alert
            tone="danger"
            text="We couldn't load your interview date. Check your connection, then try again."
          />
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => void read()}
          />
        </View>
      )}

      {load === "ready" && (
        <View style={styles.block}>
          {notice && <Alert tone={notice.tone} text={notice.text} />}
          <View style={styles.field}>
            <AppText variant="smallStrong" nativeID="interview-date-label">
              Date of your interview
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabelledBy="interview-date-label"
              accessibilityLabel={`Date of your interview, ${value ? dayAndYear(value) : "none"}`}
              accessibilityHint="Opens a calendar"
              onPress={() => setPicking(true)}
              style={[
                styles.input,
                {
                  backgroundColor: theme.bgCard,
                  borderColor: error ? theme.statusDanger : theme.borderDefault,
                  borderWidth: error ? 2 : 1,
                },
              ]}
            >
              <AppText>{value ? dayAndYear(value) : ""}</AppText>
            </Pressable>
            {error ? (
              <AppText
                variant="small"
                color="statusDanger"
                accessibilityLiveRegion="assertive"
              >
                {error}
              </AppText>
            ) : (
              line && (
                <AppText
                  variant="small"
                  color="textSecondary"
                  accessibilityLiveRegion="polite"
                >
                  {line}
                </AppText>
              )
            )}
          </View>
          <Button
            label={pending === "save" ? "Saving" : "Save date"}
            busy={pending !== null}
            onPress={save}
          />
          {removable && (
            <Button
              label={pending === "remove" ? "Removing" : "Remove date"}
              variant="secondary"
              busy={pending !== null}
              onPress={() => void send(null)}
            />
          )}
        </View>
      )}

      {picking && (
        <DateSheet
          open
          value={value}
          today={localToday()}
          onClose={() => setPicking(false)}
          onChoose={(date) => {
            setValue(date);
            setError(null);
            setPicking(false);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: touchTarget, justifyContent: "center" },
  block: { gap: space[4] },
  field: { gap: space[2] },
  input: {
    minHeight: touchTarget,
    justifyContent: "center",
    paddingHorizontal: space[3],
  },
});
