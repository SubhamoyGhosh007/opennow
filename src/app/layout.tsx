import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/styles/motion-tokens.css";
import "@/styles/transitions.css";
import "@/styles/view-transitions.css";
import "@/styles/aceternity.css";
import "@/styles/landing.css";
import "@/styles/landing-system.css";
import { ToastHost } from "@/components/motion/toast";
import { AuthProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { NavigationProgress } from "@/components/motion/nav-progress";
import React from "react";

export const metadata: Metadata = {
  title: "OpenNow — Service Operations Deck",
  description: "Self-hosted ITSM platform engine: incidents, changes, problems, SLAs, CMDB.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Self-hosted (no build-time or runtime calls to Google Fonts — the deploy
// environment cannot reliably reach fonts.gstatic.com).
const display = localFont({
  src: [
    { path: "./fonts/space-grotesk-400.woff2", weight: "400" },
    { path: "./fonts/space-grotesk-500.woff2", weight: "500" },
    { path: "./fonts/space-grotesk-600.woff2", weight: "600" },
    { path: "./fonts/space-grotesk-700.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-400.woff2", weight: "400" },
    { path: "./fonts/plus-jakarta-sans-500.woff2", weight: "500" },
    { path: "./fonts/plus-jakarta-sans-600.woff2", weight: "600" },
    { path: "./fonts/plus-jakarta-sans-700.woff2", weight: "700" },
    { path: "./fonts/plus-jakarta-sans-800.woff2", weight: "800" },
  ],
  variable: "--font-body",
  display: "swap",
});
const ticket = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-500.woff2", weight: "500" },
    { path: "./fonts/jetbrains-mono-700.woff2", weight: "700" },
  ],
  variable: "--font-ticket",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${ticket.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <React.Suspense fallback={null}>
            <NavigationProgress />
          </React.Suspense>
          <AuthProvider>
            <ToastHost>{children}</ToastHost>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
