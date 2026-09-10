import type { SmsStatus } from "@/types/sms";

interface StatusPresentation {
  label: string;
  /** One-line explanation of what the backend means by this status. */
  description: string;
  className: string;
}

/**
 * Single source of truth for how a status looks. Colours come from the status
 * tokens in globals.css, so no component picks a colour for a status itself.
 */
const STATUS_PRESENTATION: Record<SmsStatus, StatusPresentation> = {
  QUEUED: {
    label: "Queued",
    description: "Accepted and waiting for a worker.",
    className: "border-status-neutral/30 bg-status-neutral/10 text-status-neutral",
  },
  PROCESSING: {
    label: "Processing",
    description: "A worker is dispatching it to a provider.",
    className: "border-status-info/30 bg-status-info/10 text-status-info",
  },
  SENT: {
    label: "Sent",
    description: "A provider accepted the message; awaiting a delivery receipt.",
    className: "border-status-sent/30 bg-status-sent/10 text-status-sent",
  },
  DELIVERED: {
    label: "Delivered",
    description: "The carrier confirmed delivery to the recipient.",
    className: "border-status-success/30 bg-status-success/10 text-status-success",
  },
  UNDELIVERED: {
    label: "Undelivered",
    description: "A delivery receipt reported the message did not arrive.",
    className: "border-status-warning/30 bg-status-warning/10 text-status-warning",
  },
  REJECTED: {
    label: "Rejected",
    description: "The provider refused the message before delivery.",
    className: "border-status-danger/30 bg-status-danger/10 text-status-danger",
  },
  FAILED: {
    label: "Failed",
    description: "Delivery ended in a terminal failure.",
    className: "border-status-danger/30 bg-status-danger/10 text-status-danger",
  },
  FATAL_FAILURE: {
    label: "Fatal failure",
    description: "Every configured provider was exhausted. Eligible for requeue.",
    className: "border-status-critical/60 bg-status-critical/20 text-status-critical",
  },
};

export function getStatusPresentation(status: SmsStatus): StatusPresentation {
  return STATUS_PRESENTATION[status];
}

/**
 * Statuses the backend can still move away from on its own.
 *
 * SENT is deliberately included: a provider webhook can still turn it into
 * DELIVERED or UNDELIVERED, so polling must not stop there.
 */
const IN_FLIGHT_STATUSES: readonly SmsStatus[] = ["QUEUED", "PROCESSING", "SENT"];

export function isInFlight(status: SmsStatus): boolean {
  return IN_FLIGHT_STATUSES.includes(status);
}

export function canRequeue(status: SmsStatus): boolean {
  return status === "FATAL_FAILURE";
}
