import type { ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EMPTY_VALUE, formatTimestamp } from "@/lib/format";

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-muted-foreground shrink-0 text-xs tracking-wide uppercase">{label}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

/** Timestamp row: readable by default, exact ISO value on hover. */
export function TimestampRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return (
      <DetailRow label={label}>
        <span className="text-muted-foreground">{EMPTY_VALUE}</span>
      </DetailRow>
    );
  }

  return (
    <DetailRow label={label}>
      <Tooltip>
        <TooltipTrigger asChild>
          <time dateTime={value} className="font-mono text-xs">
            {formatTimestamp(value)}
          </time>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{value}</p>
        </TooltipContent>
      </Tooltip>
    </DetailRow>
  );
}
