"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { getHealth, getSms, requeueSms, sendSms } from "@/lib/api/sms";
import { isInFlight } from "@/lib/sms-status";
import type { SendSmsPayload, SmsTrackingData } from "@/types/sms";

const POLL_INTERVAL_MS = 2000;
const HEALTH_INTERVAL_MS = 30_000;

export const smsQueryKeys = {
  message: (messageId: string) => ["sms", messageId] as const,
  health: () => ["health"] as const,
};

/**
 * Tracks one message, polling only while the backend can still change it on
 * its own.
 *
 * SENT keeps polling because a provider webhook can still move it to DELIVERED
 * or UNDELIVERED; the terminal statuses stop it. A message that does not exist
 * is not retried, since retrying a 404 would never start returning a result.
 */
export function useSmsMessage(messageId: string | null) {
  return useQuery<SmsTrackingData, ApiError>({
    queryKey: smsQueryKeys.message(messageId ?? ""),
    queryFn: ({ signal }) => getSms(messageId as string, signal),
    enabled: messageId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status && isInFlight(status) ? POLL_INTERVAL_MS : false;
    },
    retry: (failureCount, error) => !error.isNotFound && failureCount < 2,
  });
}

export function useSendSms() {
  return useMutation<
    Awaited<ReturnType<typeof sendSms>>,
    ApiError,
    { payload: SendSmsPayload; idempotencyKey: string }
  >({
    mutationFn: ({ payload, idempotencyKey }) => sendSms(payload, idempotencyKey),
  });
}

export function useRequeueSms(messageId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Awaited<ReturnType<typeof requeueSms>>, ApiError, void>({
    mutationFn: () => requeueSms(messageId as string),
    onSuccess: async () => {
      if (messageId) {
        // Bringing the message back to QUEUED restarts polling on the next read.
        await queryClient.invalidateQueries({ queryKey: smsQueryKeys.message(messageId) });
      }
    },
  });
}

/** Connection indicator. Polled slowly; it only reports reachability. */
export function useApiHealth() {
  return useQuery<{ status: "ok" }, ApiError>({
    queryKey: smsQueryKeys.health(),
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: HEALTH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: HEALTH_INTERVAL_MS,
  });
}
