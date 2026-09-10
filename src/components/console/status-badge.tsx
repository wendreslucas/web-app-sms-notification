import { cn } from "cn";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getStatusPresentation } from "@/lib/sms-status";
import type { SmsStatus } from "@/types/sms";

interface StatusBadgeProps {
  status: SmsStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, description, className: statusClassName } = getStatusPresentation(status);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
            statusClassName,
            className,
          )}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-56">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
