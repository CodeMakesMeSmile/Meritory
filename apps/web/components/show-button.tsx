import { linkClass } from "./button";

/** Shows or hides a password field's text */
export function ShowButton({
  shown,
  onToggle,
  what,
}: {
  shown: boolean;
  onToggle: () => void;
  what: string;
}) {
  return (
    <button
      type="button"
      className={linkClass}
      aria-label={`${shown ? "Hide" : "Show"} ${what}`}
      onClick={onToggle}
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}
