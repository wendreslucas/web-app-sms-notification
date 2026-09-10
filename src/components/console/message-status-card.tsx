"use client";

import { InboxIcon, Loader2Icon, RotateCcwIcon, SearchXIcon } from "lucide-react";

import { CopyButton } from "@/components/console/copy-button";
import { DeliveryTimeline } from "@/components/console/delivery-timeline";
import { DetailRow, TimestampRow } from "@/components/console/detail-row";
import { StatusBadge } from "@/components/console/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequeueSms, useSmsMessage } from "@/hooks/use-sms";
import { EMPTY_VALUE, truncateMiddle } from "@/lib/format";
import { canRequeue, isInFlight } from "@/lib/sms-status";

function CardShell({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    // flex-1 fills whatever height the column has left; h-full would claim the
    // whole column and squeeze the tracking card above it.
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Message status</CardTitle>
        <CardDescription>
          {description ?? (
            <>
              Live view from <code className="font-mono text-xs">GET /api/v1/sms/:messageId</code>.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function MessageStatusCard({ messageId }: { messageId: string | null }) {
  const query = useSmsMessage(messageId);
  const requeueMutation = useRequeueSms(messageId);

  if (!messageId) {
    return (
      <CardShell>
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
          <InboxIcon className="text-muted-foreground/60 size-8" aria-hidden />
          <p className="text-sm font-medium">No message selected</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Send a new SMS or enter a message ID to start tracking.
          </p>
        </div>
      </CardShell>
    );
  }

  if (query.isPending) {
    return (
      <CardShell>
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </CardShell>
    );
  }

  if (query.isError) {
    const notFound = query.error.isNotFound;
    const unreachable = query.error.statusCode === null;
    const errorTitle = notFound ? "Message not found" : unreachable ? "API unreachable" : "Request failed";

    return (
      <CardShell>
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
          <SearchXIcon className="text-muted-foreground/60 size-8" aria-hidden />
          <p className="text-sm font-medium">{errorTitle}</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            {notFound
              ? "No message matches that ID. Check the value and try again."
              : query.error.message}
          </p>
        </div>
      </CardShell>
    );
  }

  const message = query.data;
  const polling = isInFlight(message.status);

  return (
    <CardShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={message.status} />
          {polling && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2Icon className="size-3 animate-spin" aria-hidden />
              Polling every 2s
            </span>
          )}
        </div>

        <dl className="divide-border divide-y">
          <DetailRow label="Message ID">
            <span className="flex items-center justify-end gap-1">
              <span className="font-mono text-xs break-all">{truncateMiddle(message.messageId)}</span>
              <CopyButton value={message.messageId} label="message ID" />
            </span>
          </DetailRow>

          <DetailRow label="Provider">
            {message.selectedProvider ? (
              <span className="capitalize">{message.selectedProvider}</span>
            ) : (
              <span className="text-muted-foreground">{EMPTY_VALUE}</span>
            )}
          </DetailRow>

          <DetailRow label="Provider message ID">
            {message.providerMessageId ? (
              <span className="font-mono text-xs break-all">{message.providerMessageId}</span>
            ) : (
              <span className="text-muted-foreground">{EMPTY_VALUE}</span>
            )}
          </DetailRow>

          <DetailRow label="Provider attempts">
            <span className="font-mono text-xs">{message.attempts}</span>
          </DetailRow>

          <TimestampRow label="Created at" value={message.createdAt} />
          <TimestampRow label="Sent at" value={message.sentAt} />
          <TimestampRow label="Delivered at" value={message.deliveredAt} />
          <TimestampRow label="Failed at" value={message.failedAt} />
        </dl>

        <Separator />

        <div>
          <h3 className="text-muted-foreground mb-3 text-xs tracking-wide uppercase">Timeline</h3>
          <DeliveryTimeline message={message} />
        </div>

        {canRequeue(message.status) && (
          <>
            <Separator />
            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-full px-5"
                    disabled={requeueMutation.isPending}
                  >
                    {requeueMutation.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <RotateCcwIcon className="size-4" />
                    )}
                    Requeue message
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Requeue this message?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will queue this message for another delivery attempt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => requeueMutation.mutate()}>
                      Requeue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {requeueMutation.isError && (
                <Alert variant="destructive">
                  <AlertTitle>Requeue failed</AlertTitle>
                  <AlertDescription>{requeueMutation.error.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </div>
    </CardShell>
  );
}
