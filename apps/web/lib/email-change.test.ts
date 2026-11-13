import { describe, expect, it } from "vitest";
import {
  emailStep,
  FAILED_LINK,
  sentNotice,
  stepNotice,
} from "./email-change.ts";

describe("emailStep", () => {
  it.each(["approved", "changed", "failed"])("reads %s", (step) => {
    expect(emailStep(step, undefined)).toBe(step);
  });

  it("treats any error from the link as failed", () => {
    expect(emailStep("changed", "INVALID_USER")).toBe("failed");
    expect(emailStep("approved", "")).toBe("failed");
  });

  it.each([undefined, "", "done", ["changed", "changed"], "<b>changed</b>"])(
    "ignores %j",
    (value) => {
      expect(emailStep(value, undefined)).toBeNull();
    },
  );
});

describe("notices", () => {
  it("names the new address once the change is done", () => {
    expect(stepNotice("changed", "rowan@meritory.test")).toEqual({
      tone: "success",
      text: "Your email is now rowan@meritory.test. Your other devices were signed out.",
    });
  });

  it("points at the new inbox after approval, without naming it", () => {
    const notice = stepNotice("approved", "rowan@meritory.test");
    expect(notice.tone).toBe("info");
    expect(notice.text).not.toContain("rowan@meritory.test");
  });

  it("says nothing changed when a link fails", () => {
    expect(stepNotice("failed", "rowan@meritory.test")).toEqual({
      tone: "danger",
      text: FAILED_LINK,
    });
  });

  it("sends people to the current inbox first", () => {
    expect(sentNotice("rowan@meritory.test").text).toBe(
      "Check rowan@meritory.test for a link to approve the change. It works for 1 hour.",
    );
  });
});
