import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { PwaStatus } from "@/components/pwa/pwa-status";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Digital Twin Command Center",
    template: "%s · Digital Twin Command Center",
  },
  description:
    "AI-powered command center for calls, live transcripts, whisper control, and market intelligence.",
  applicationName: "Digital Twin Command Center",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Twin Command",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <PwaStatus />
        {children}
      </body>
    </html>
  );
}
