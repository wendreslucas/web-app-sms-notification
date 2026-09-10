import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import { Providers } from "./providers";
import "./globals.css";

// Montserrat echoes the geometric sans of the Carlton One site; Geist Mono is
// kept for identifiers, keys and timestamps.
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMS Notification Service — Operations Console",
  description:
    "Demo console for the SMS Notification Microservice: send a message, follow its delivery status and inspect the provider that handled it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme class on <html> before hydration, so the
    // server markup cannot match it exactly.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
