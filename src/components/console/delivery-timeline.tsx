import { cn } from "cn";

import { formatTimestamp } from "@/lib/format";
import type { SmsTrackingData, SmsStatus } from "@/types/sms";

interface TimelineStep {
  label: string;
  caption: string;
  timestamp: string | null;
  state: "done" | "current" | "pending" | "failed";
}

const REACHED_PROVIDER: readonly SmsStatus[] = [
  "SENT",
  "DELIVERED",
  "UNDELIVERED",
  "REJECTED",
  "FAILED",
];

const FAILED_OUTCOMES: readonly SmsStatus[] = [
  "UNDELIVERED",
  "REJECTED",
  "FAILED",
  "FATAL_FAILURE",
];

/**
 * Timeline built strictly from the fields the tracking endpoint returns.
 *
 * The API exposes no per-attempt history, so individual provider attempts and
 * failover hops are deliberately not shown; the attempt counter is reported on
 * its own instead.
 */
function buildSteps(message: SmsTrackingData): TimelineStep[] {
  const reachedProvider = REACHED_PROVIDER.includes(message.status);
  const failed = FAILED_OUTCOMES.includes(message.status);

  const accepted: TimelineStep = {
    label: "Accepted",
    caption: "The API accepted the request and persisted it.",
    timestamp: message.createdAt,
    state: "done",
  };

  const processing: TimelineStep = {
    label: "Processing",
    caption: "A worker claimed the message for dispatch.",
    timestamp: null,
    state:
      message.status === "PROCESSING"
        ? "current"
        : message.status === "QUEUED"
          ? "pending"
          : "done",
  };

  const providerAccepted: TimelineStep = {
    label: "Provider accepted",
    caption: message.selectedProvider
      ? `Handed to ${message.selectedProvider}.`
      : "Waiting for a provider to accept it.",
    timestamp: message.sentAt,
    state:
      message.status === "SENT"
        ? "current"
        : message.status === "FATAL_FAILURE"
          ? "failed"
          : reachedProvider
            ? "done"
            : "pending",
  };

  const delivered: TimelineStep = {
    label: failed ? "Delivery failed" : "Delivered",
    caption: failed
      ? "The delivery receipt reported a failure."
      : "The carrier confirmed delivery to the recipient.",
    timestamp: message.deliveredAt ?? message.failedAt,
    state:
      message.status === "DELIVERED"
        ? "done"
        : failed
          ? "failed"
          : "pending",
  };

  return [accepted, processing, providerAccepted, delivered];
}

const STATE_DOT: Record<TimelineStep["state"], string> = {
  done: "border-status-success/60 bg-status-success",
  current: "border-status-info/70 bg-status-info animate-pulse",
  pending: "border-border bg-muted",
  failed: "border-status-danger/60 bg-status-danger",
};

export function DeliveryTimeline({ message }: { message: SmsTrackingData }) {
  const steps = buildSteps(message);

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn("mt-1 size-2.5 shrink-0 rounded-full border", STATE_DOT[step.state])}
              />
              {!isLast && <span aria-hidden className="bg-border w-px flex-1" />}
            </div>

            <div className={cn("pb-4", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "pending" && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="text-muted-foreground text-xs">{step.caption}</p>
              {step.timestamp && (
                <p className="text-muted-foreground/80 mt-0.5 font-mono text-[11px]">
                  {formatTimestamp(step.timestamp)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
