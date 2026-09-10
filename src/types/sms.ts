/** Message lifecycle, mirroring the backend's SmsStatus enum. */
export type SmsStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "UNDELIVERED"
  | "REJECTED"
  | "FAILED"
  | "FATAL_FAILURE";

export const SMS_STATUSES: readonly SmsStatus[] = [
  "QUEUED",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "UNDELIVERED",
  "REJECTED",
  "FAILED",
  "FATAL_FAILURE",
];

export function isSmsStatus(value: unknown): value is SmsStatus {
  return typeof value === "string" && SMS_STATUSES.includes(value as SmsStatus);
}

/** Envelope every endpoint returns. */
export interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

/** POST /api/v1/sms/send */
export interface SendSmsPayload {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SendSmsData {
  messageId: string;
  status: SmsStatus;
  createdAt: string;
}

/** GET /api/v1/sms/:messageId */
export interface SmsTrackingData {
  messageId: string;
  status: SmsStatus;
  attempts: number;
  selectedProvider: string | null;
  providerMessageId: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
}

/** POST /api/v1/admin/sms/:messageId/requeue */
export interface RequeueSmsData {
  messageId: string;
  status: SmsStatus;
  createdAt: string;
}

export interface HealthData {
  status: "ok";
}
