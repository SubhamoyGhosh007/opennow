import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
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

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700", "800"] });
const ticket = JetBrains_Mono({ subsets: ["latin"], variable: "--font-ticket", weight: ["500", "700"] });

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
