const DEFAULT_API_URL = "http://localhost:3001";
const DEFAULT_MAX_MESSAGE_LENGTH = 1600;

function readMaxMessageLength(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_SMS_MAX_MESSAGE_LENGTH);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_MESSAGE_LENGTH;
}

/**
 * Runtime configuration. Both values are public by design: the API origin is
 * visible in every request the browser makes, and the length limit only drives
 * the character counter. No credential belongs here.
 */
export const config = {
  /** Origin of the SMS microservice, without a trailing slash. */
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, ""),
  /** Mirrors SMS_MAX_MESSAGE_LENGTH; the backend stays the authority. */
  maxMessageLength: readMaxMessageLength(),
} as const;
