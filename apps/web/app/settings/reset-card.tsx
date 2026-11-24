"use client";

import {
  RESET_DESCRIPTION,
  RESET_DONE,
  SAVE_FAILED,
} from "@meritory/recall-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { resetSettings, type SettingsResponse } from "@/lib/recall-api";
import { Card } from "../account/card";
import { Footer, OfflineAlert } from "./parts";
import { type Notice, useOnline } from "./use-save";

/** Puts every setting back, after asking once */
export function ResetCard({
  data,
  onReset,
}: {
  data: SettingsResponse;
  onReset: (data: SettingsResponse) => void;
}) {
  const router = useRouter();
  const online = useOnline();
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const { suggested } = data;

  async function reset() {
    setPending(true);
    const result = await resetSettings();
    setPending(false);
    setAsking(false);
    if (result.ok) {
      onReset(result.data);
      setNotice({ tone: "success", text: RESET_DONE });
    } else if (result.reason === "signed_out") {
      router.replace("/sign-in?next=/settings");
    } else {
      setNotice({ tone: "danger", text: SAVE_FAILED });
    }
  }

  return (
    <Card title="Reset all" description={RESET_DESCRIPTION}>
      <OfflineAlert online={online} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setNotice(null);
          setAsking(true);
        }}
        className="flex flex-col gap-4"
      >
        <Footer
          notice={notice}
          pending={false}
          online={online}
          label="Reset all settings"
        />
      </form>
      <Dialog
        open={asking}
        title="Reset all settings?"
        onClose={() => setAsking(false)}
      >
        <p className="text-small text-secondary">
          Every setting goes back to its suggested value, like{" "}
          {suggested.newCardsPerDay} new cards a day and a{" "}
          {suggested.recallTarget}% recall target. Your progress, interview
          date, and account stay as they are.
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setAsking(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            aria-busy={pending}
            onClick={() => void reset()}
          >
            {pending ? "Resetting" : "Reset all settings"}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
