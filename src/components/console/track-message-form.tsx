"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackMessageSchema, type TrackMessageValues } from "@/lib/send-sms-schema";

interface TrackMessageFormProps {
  onTrack: (messageId: string) => void;
}

export function TrackMessageForm({ onTrack }: TrackMessageFormProps) {
  const form = useForm<TrackMessageValues>({
    resolver: zodResolver(trackMessageSchema),
    mode: "onBlur",
    defaultValues: { messageId: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    onTrack(values.messageId.trim());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Track existing message</CardTitle>
        <CardDescription>Load any message by the ID the send response returned.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-2" noValidate>
          <Label htmlFor="messageId" className="sr-only">
            Message ID
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="messageId"
              placeholder="c8d488e9-f308-43e8-8db9-8df0cb5134ef"
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
              aria-invalid={Boolean(form.formState.errors.messageId)}
              aria-describedby={form.formState.errors.messageId ? "messageId-error" : undefined}
              {...form.register("messageId")}
            />
            <Button type="submit" variant="secondary" className="gap-2 rounded-full px-5 sm:w-auto">
              <SearchIcon className="size-4" />
              Track
            </Button>
          </div>
          {form.formState.errors.messageId && (
            <p id="messageId-error" className="text-destructive text-xs">
              {form.formState.errors.messageId.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
