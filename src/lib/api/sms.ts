import { apiRequest } from "@/lib/api/client";
import type {
  ApiEnvelope,
  HealthData,
  RequeueSmsData,
  SendSmsData,
  SendSmsPayload,
  SmsTrackingData,
} from "@/types/sms";

const IDEMPOTENCY_KEY_HEADER = "X-Idempotency-Key";

/**
 * Accepts an SMS for delivery.
 *
 * The idempotency key travels as a header, never in the body: replaying the
 * same key returns the existing message instead of queuing a second one.
 */
export async function sendSms(
  payload: SendSmsPayload,
  idempotencyKey: string,
): Promise<SendSmsData> {
  const response = await apiRequest<ApiEnvelope<SendSmsData>>({
    method: "POST",
    path: "/api/v1/sms/send",
    body: payload,
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
  });

  return response.data;
}

/** Reads the current tracking state of a message. */
export async function getSms(messageId: string, signal?: AbortSignal): Promise<SmsTrackingData> {
  const response = await apiRequest<ApiEnvelope<SmsTrackingData>>({
    path: `/api/v1/sms/${encodeURIComponent(messageId)}`,
    signal,
  });

  return response.data;
}

/** Queues a fatally failed message for another delivery attempt. */
export async function requeueSms(messageId: string): Promise<RequeueSmsData> {
  const response = await apiRequest<ApiEnvelope<RequeueSmsData>>({
    method: "POST",
    path: `/api/v1/admin/sms/${encodeURIComponent(messageId)}/requeue`,
  });

  return response.data;
}

/** Liveness probe used by the header's connection indicator. */
export async function getHealth(signal?: AbortSignal): Promise<HealthData> {
  return apiRequest<HealthData>({ path: "/api/health", signal });
}
