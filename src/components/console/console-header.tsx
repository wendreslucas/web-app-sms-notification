"use client";

import Image from "next/image";
import { cn } from "cn";

import { ThemeToggle } from "@/components/console/theme-toggle";
import { useApiHealth } from "@/hooks/use-sms";

/** Width and height keep the logo's own 7.13:1 ratio at a 24px height. */
const LOGO_WIDTH = 171;
const LOGO_HEIGHT = 24;

function ApiStatus() {
  const health = useApiHealth();

  const state = health.isPending ? "checking" : health.isSuccess ? "online" : "offline";

  const label = {
    checking: "Checking API",
    online: "API online",
    offline: "API offline",
  }[state];

  return (
    <span
      role="status"
      aria-live="polite"
      className="border-border bg-background text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          state === "online" && "bg-status-success",
          state === "offline" && "bg-status-danger",
          state === "checking" && "bg-status-neutral animate-pulse",
        )}
      />
      {label}
    </span>
  );
}

/**
 * The logo's wordmark is charcoal, which disappears on the dark theme, so a
 * reversed copy (white wordmark, same azure "One") takes its place there.
 */
function BrandLogo() {
  return (
    <>
      <Image
        src="/CarltonOne_Logo_TM2-.svg"
        alt="CarltonOne"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="h-6 w-auto dark:hidden"
      />
      <Image
        src="/CarltonOne_Logo_TM2-reversed.svg"
        alt="CarltonOne"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="hidden h-6 w-auto dark:block"
      />
    </>
  );
}

export function ConsoleHeader() {
  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <BrandLogo />
          <span aria-hidden className="bg-border h-8 w-px" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight">SMS Notification Service</h1>
            <p className="text-muted-foreground text-xs font-medium">Operations Console</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatus />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
