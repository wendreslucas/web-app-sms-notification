/** Placeholder shown wherever the API returned null. */
export const EMPTY_VALUE = "—";

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

/** Human-readable timestamp; the raw ISO string stays available for tooltips. */
export function formatTimestamp(value: string | null): string {
  if (!value) {
    return EMPTY_VALUE;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? value : TIMESTAMP_FORMAT.format(parsed);
}

/** Keeps long identifiers readable without hiding which value they are. */
export function truncateMiddle(value: string, visible = 8): string {
  if (value.length <= visible * 2 + 1) {
    return value;
  }

  return `${value.slice(0, visible)}…${value.slice(-visible)}`;
}
