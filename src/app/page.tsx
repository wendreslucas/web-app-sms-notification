"use client";

import { useState } from "react";

import { ConsoleFooter } from "@/components/console/console-footer";
import { ConsoleHeader } from "@/components/console/console-header";
import { MessageStatusCard } from "@/components/console/message-status-card";
import { SendSmsForm } from "@/components/console/send-sms-form";
import { TrackMessageForm } from "@/components/console/track-message-form";

export default function ConsolePage() {
  // The tracked id lives in React state only. Nothing about the message, the
  // recipient or its content is written to browser storage.
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  return (
    <>
      <ConsoleHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SendSmsForm
            onMessageAccepted={setSelectedMessageId}
            currentMessageId={selectedMessageId}
          />

          <div className="flex min-w-0 flex-col gap-6">
            <TrackMessageForm onTrack={setSelectedMessageId} />
            <MessageStatusCard messageId={selectedMessageId} />
          </div>
        </div>
      </main>

      <ConsoleFooter />
    </>
  );
}
