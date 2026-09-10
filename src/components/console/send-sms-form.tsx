"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, RefreshCwIcon, RepeatIcon, SendIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { CopyButton } from "@/components/console/copy-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSendSms } from "@/hooks/use-sms";
import { config } from "@/lib/config";
import {
  sendSmsFormSchema,
  toSendSmsRequest,
  type SendSmsFormValues,
  type SendSmsRequest,
} from "@/lib/send-sms-schema";

interface SendSmsFormProps {
  onMessageAccepted: (messageId: string) => void;
  /** Message id currently on screen, used to spot an idempotent replay. */
  currentMessageId: string | null;
}

/** The exact request that was last accepted, kept only in memory. */
interface AcceptedRequest {
  payload: SendSmsRequest;
  idempotencyKey: string;
  messageId: string;
}

const DEFAULT_METADATA = `{
  "userId": "usr_123456",
  "purpose": "OTP"
}`;

export function SendSmsForm({ onMessageAccepted, currentMessageId }: SendSmsFormProps) {
  const sendMutation = useSendSms();
  const [lastAccepted, setLastAccepted] = useState<AcceptedRequest | null>(null);
  const [replayedMessageId, setReplayedMessageId] = useState<string | null>(null);

  const form = useForm<SendSmsFormValues>({
    resolver: zodResolver(sendSmsFormSchema),
    mode: "onBlur",
    defaultValues: {
      to: "",
      message: "",
      idempotencyKey: "",
      metadata: DEFAULT_METADATA,
    },
  });

  // Generated in an effect so the server render and the first client render
  // agree; a random value produced during render would not match.
  useEffect(() => {
    form.setValue("idempotencyKey", crypto.randomUUID());
  }, [form]);

  const messageValue = useWatch({ control: form.control, name: "message" });
  const idempotencyKey = useWatch({ control: form.control, name: "idempotencyKey" });
  const isSending = sendMutation.isPending;

  function send(payload: SendSmsRequest, key: string) {
    sendMutation.mutate(
      { payload, idempotencyKey: key },
      {
        onSuccess: (data) => {
          // The same key returning the same id is the backend refusing to queue
          // a second message, which is exactly what this panel demonstrates.
          const isReplay =
            lastAccepted !== null &&
            lastAccepted.idempotencyKey === key &&
            lastAccepted.messageId === data.messageId;

          setReplayedMessageId(isReplay ? data.messageId : null);
          setLastAccepted({ payload, idempotencyKey: key, messageId: data.messageId });
          onMessageAccepted(data.messageId);
        },
      },
    );
  }

  function regenerateKey() {
    form.setValue("idempotencyKey", crypto.randomUUID(), { shouldValidate: true });
    setLastAccepted(null);
    setReplayedMessageId(null);
  }

  const onSubmit = form.handleSubmit((values) => {
    send(toSendSmsRequest(values), values.idempotencyKey);
  });

  /** Replays the last accepted request byte for byte, whatever the form now holds. */
  function replayLastRequest() {
    if (lastAccepted) {
      send(lastAccepted.payload, lastAccepted.idempotencyKey);
    }
  }

  const showReplayHint = replayedMessageId !== null && replayedMessageId === currentMessageId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send SMS</CardTitle>
        <CardDescription>
          Queues a message through <code className="font-mono text-xs">POST /api/v1/sms/send</code>.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="to">Recipient</Label>
            <Input
              id="to"
              placeholder="+14155552671"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              aria-invalid={Boolean(form.formState.errors.to)}
              aria-describedby={form.formState.errors.to ? "to-error" : "to-hint"}
              {...form.register("to")}
            />
            {form.formState.errors.to ? (
              <p id="to-error" className="text-destructive text-xs">
                {form.formState.errors.to.message}
              </p>
            ) : (
              <p id="to-hint" className="text-muted-foreground text-xs">
                E.164 format, including the country code.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="message">Message</Label>
              <span
                className={
                  messageValue.length > config.maxMessageLength
                    ? "text-destructive font-mono text-xs"
                    : "text-muted-foreground font-mono text-xs"
                }
              >
                {messageValue.length} / {config.maxMessageLength}
              </span>
            </div>
            <Textarea
              id="message"
              rows={4}
              placeholder="Your verification code is 482019"
              aria-invalid={Boolean(form.formState.errors.message)}
              aria-describedby={form.formState.errors.message ? "message-error" : undefined}
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p id="message-error" className="text-destructive text-xs">
                {form.formState.errors.message.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="idempotencyKey">Idempotency key</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-7 gap-1.5 rounded-full text-xs"
                onClick={regenerateKey}
                disabled={isSending}
              >
                <RefreshCwIcon className="size-3" />
                Generate new
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Input
                id="idempotencyKey"
                readOnly
                className="bg-muted/40 font-mono text-xs"
                aria-describedby="idempotency-hint"
                {...form.register("idempotencyKey")}
              />
              {idempotencyKey && <CopyButton value={idempotencyKey} label="idempotency key" />}
            </div>
            <p id="idempotency-hint" className="text-muted-foreground text-xs">
              Sent as <code className="font-mono">X-Idempotency-Key</code>. It is kept between
              submissions, so sending twice returns the same message instead of queuing another.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata</Label>
            <Textarea
              id="metadata"
              rows={4}
              spellCheck={false}
              className="font-mono text-xs"
              placeholder="{}"
              aria-invalid={Boolean(form.formState.errors.metadata)}
              aria-describedby={form.formState.errors.metadata ? "metadata-error" : "metadata-hint"}
              {...form.register("metadata")}
            />
            {form.formState.errors.metadata ? (
              <p id="metadata-error" className="text-destructive text-xs">
                {form.formState.errors.metadata.message}
              </p>
            ) : (
              <p id="metadata-hint" className="text-muted-foreground text-xs">
                Optional JSON object. Leave empty to omit it.
              </p>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSending} className="gap-2 rounded-full px-5 font-semibold">
              {isSending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
              {isSending ? "Sending" : "Send SMS"}
            </Button>

            {lastAccepted && (
              <Button
                type="button"
                variant="outline"
                disabled={isSending}
                onClick={replayLastRequest}
                className="gap-2 rounded-full px-5"
                title="Resends the exact last payload with the same idempotency key"
              >
                <RepeatIcon className="size-4" />
                Send same request again
              </Button>
            )}
          </div>

          {lastAccepted && (
            <div className="bg-muted/40 rounded-md border px-3 py-2">
              <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Idempotency key used
              </p>
              <p className="font-mono text-xs break-all">{lastAccepted.idempotencyKey}</p>
            </div>
          )}

          {showReplayHint && (
            <Alert>
              <AlertTitle>Idempotent request</AlertTitle>
              <AlertDescription>
                Existing message returned. No second SMS was queued.
              </AlertDescription>
            </Alert>
          )}

          {sendMutation.isError && (
            <Alert variant="destructive">
              {/* No status code means the request never got an answer. */}
              <AlertTitle>
                {sendMutation.error.statusCode === null ? "API unreachable" : "Request rejected"}
              </AlertTitle>
              <AlertDescription>
                <p>{sendMutation.error.message}</p>
                {sendMutation.error.details.length > 1 && (
                  <ul className="list-inside list-disc">
                    {sendMutation.error.details.slice(1).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
