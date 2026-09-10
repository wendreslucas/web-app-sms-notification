import { z } from "zod";

import { config } from "@/lib/config";

/**
 * E.164, matching the backend rule: a leading +, a non-zero country digit, and
 * 7 to 15 digits in total.
 */
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Metadata is edited as free text and only parsed at submit time, so an
 * in-progress object does not fight the user with errors on every keystroke.
 */
function parseMetadata(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  return JSON.parse(trimmed) as Record<string, unknown>;
}

export const sendSmsFormSchema = z.object({
  to: z
    .string()
    .min(1, "Recipient is required.")
    .regex(E164_PATTERN, "Enter a phone number in E.164 format, for example +14155552671."),
  message: z
    .string()
    .min(1, "Message is required.")
    // Mirrors the backend: a body of only whitespace carries no content.
    .refine((value) => value.trim().length > 0, "Message cannot be only whitespace.")
    .refine(
      (value) => value.length <= config.maxMessageLength,
      `Message must be at most ${config.maxMessageLength} characters.`,
    ),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
  metadata: z
    .string()
    .refine((value) => {
      if (value.trim().length === 0) {
        return true;
      }

      try {
        const parsed: unknown = JSON.parse(value);
        return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
      } catch {
        return false;
      }
    }, "Metadata must be a JSON object, or left empty."),
});

export type SendSmsFormValues = z.infer<typeof sendSmsFormSchema>;

export interface SendSmsRequest {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/** Turns validated form values into the request body the API expects. */
export function toSendSmsRequest(values: SendSmsFormValues): SendSmsRequest {
  return {
    to: values.to,
    message: values.message,
    metadata: parseMetadata(values.metadata),
  };
}

export const trackMessageSchema = z.object({
  messageId: z
    .string()
    .min(1, "Message ID is required.")
    .regex(UUID_PATTERN, "Enter a valid message ID."),
});

export type TrackMessageValues = z.infer<typeof trackMessageSchema>;
