import { config } from "@/lib/config";

export function ConsoleFooter() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs sm:px-6">
        <p>Next.js demo interface for the SMS Notification Microservice</p>
        <p>
          API: <code className="font-mono">{config.apiUrl}</code>
        </p>
      </div>
    </footer>
  );
}
